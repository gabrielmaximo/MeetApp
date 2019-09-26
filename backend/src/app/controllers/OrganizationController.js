import File from '../models/File';
import Meetup from '../models/Meetup';

class OrganizationController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      attributes: ['id', 'user_id', 'title', 'description', 'location', 'date'],
      include: [
        {
          model: File,
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
      order: ['date'],
    });

    return res.json(meetups);
  }
}

export default new OrganizationController();
