import File from '../models/File';

class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const avatar = await File.create({
      name,
      path,
    });

    return res.json(avatar);
  }
}

export default new FileController();
