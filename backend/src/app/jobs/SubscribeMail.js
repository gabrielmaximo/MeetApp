import pt from 'date-fns/locale/pt-BR';
import { format, parseISO } from 'date-fns';
import Mail from '../../lib/Mail';

class SubscribeMail {
  get key() {
    return 'SubscribeMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`,
      subject: 'Nova inscrição realizada!',
      template: 'subscribe',
      context: {
        name: meetup.User.name,
        user: user.name,
        title: meetup.title,
        date: format(parseISO(meetup.date), "dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
        description: meetup.description,
      },
    });
  }
}

export default new SubscribeMail();
