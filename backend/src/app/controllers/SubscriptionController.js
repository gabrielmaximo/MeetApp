import { Op } from 'sequelize';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Meetup from '../models/Meetup';
import Queue from '../../lib/Queue';
import SubscribeMail from '../jobs/SubscribeMail';
import File from '../models/File';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
          attributes: ['user_id', 'title', 'description', 'location', 'date'],
          include: [
            {
              model: File,
              attributes: ['id', 'name', 'path', 'url'],
              required: true,
            },
          ],
        },
      ],
      attributes: ['id', 'UserId', 'meetup_id'],
      order: [[Meetup, 'date']],
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({ er: "This user don't have subscriptions" });
    }

    return res.json(subscriptions);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exists!' });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(401)
        .json({ error: "Can't subscribe to you own meetups" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't subscribe to past meetups" });
    }

    const alreadySubs = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.params.meetupId,
      },
    });

    if (alreadySubs) {
      return res
        .status(400)
        .json({ error: 'User already subscribed in this meetup' });
    }

    const sameTime = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (sameTime) {
      return res
        .status(401)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    const subscription = await Subscription.create({
      user_id: req.userId,
      meetup_id: meetup.id,
    });

    const user = await User.findByPk(req.userId);

    await Queue.add(SubscribeMail.key, { meetup, user });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
