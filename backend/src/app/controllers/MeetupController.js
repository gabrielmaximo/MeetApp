import * as Yup from 'yup';
import { startOfDay, endOfDay, parseISO, isBefore } from 'date-fns';
import { Op } from 'sequelize';
import File from '../models/File';
import User from '../models/User';
import Meetup from '../models/Meetup';

class MeetupController {
  async index(req, res) {
    if (!req.query.page) {
      return res.status(400).json({ error: 'Page invalid or undefined' });
    }

    const { page = 1 } = req.query;

    if (!req.query.date) {
      return res.status(400).json({ error: 'Date invalid or undefined' });
    }

    if (isBefore(parseISO(req.query.date), startOfDay(new Date()))) {
      return res.status(400).json({ error: 'Past dates are not permited!' });
    }

    const searchDate = parseISO(req.query.date);

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
          [Op.gt]: new Date(),
        },
      },
      attributes: ['id', 'title', 'description', 'location', 'date'],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          required: true,
        },
        {
          model: File,
          attributes: ['id', 'name', 'path', 'url'],
          required: true,
        },
      ],
      limit: 10,
      offset: (page - 1) * 10,
      order: ['date'],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      file_id: Yup.number().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails!' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'This date is not valid!' });
    }

    const meetup = await Meetup.create({
      ...req.body,
      user_id: req.userId,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      file_id: Yup.number(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails!' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'This date is not valid' });
    }
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exists!' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Permission denied!' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't update past meetups" });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exists in DB' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Permission Denied (not owner)' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't delete past meetups." });
    }

    const del = await meetup.destroy();

    return res.json({
      status: 'delete-table',
      sucess: !!del,
      message: del ? 'Meetup has been deleted' : 'Fail to delete Meetup',
    });
  }
}

export default new MeetupController();
