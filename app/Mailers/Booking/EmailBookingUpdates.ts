import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail';
import mail from 'Config/mail';
import Customer from 'App/Models/Customer/Customer';
import Booking from 'App/Models/Booking/Booking';
import ExceptionHandler from 'App/Exceptions/Handler';
import sendData from '@ioc:App/Helpers/SendData';
import moment from 'moment/moment';
import BookingPayment from 'App/Models/Booking/BookingPayment';

export default class EmailBookingUpdates extends BaseMailer {
  /**
   * Constructor
   *
   * @param customer
   * @param booking
   * @param type
   */
  constructor (private customer: Customer, private booking: Booking, private type: 'booking:invoiced') {
    super();
  }

  /**
   * Email
   *
   * @param message
   */
  public async prepare (message: MessageContract) {
    const customerEmail = this.customer.emails.data.find(email => email.isPrimary)?.email;
    await this.booking.load('schedules', (query) => {
      query.whereNotIn('status', ['DRAFT']);
      query.orderByRaw('CASE WHEN booking_start >= CURRENT_DATE THEN 1 ELSE 2 END, booking_start');
    });
    await this.booking.load('payments', (query) => {
      query.orderBy('createdAt', 'desc');
    });

    if (!customerEmail) {
      return;
    }

    const bookingEmailData = await this.getBookingUpdateEmailData();
    message
      .subject(bookingEmailData.subject)
      .from(mail.fromEmail, mail.fromName)
      .to(customerEmail)
      .htmlView('emails/default',{
        greeting: this.customer.firstName,
        subject: bookingEmailData.subject,
        title: bookingEmailData.title,
        message: bookingEmailData.message,
      });

    // Attach invoice pdf
    if (bookingEmailData.attachment) {
      message.attach(bookingEmailData.attachment, {
        filename: `${this.booking.did}-${moment().format('YYYY-MM-DD-HH-mm')}.pdf`,
      });
    }
  }

  /**
   * Get email subject, title and body
   */
  private async getBookingUpdateEmailData () {
    const bookingScheduleCard = await this.generateBookingScheduleCard();
    const bookingPayments = this.booking.payments.filter((payment: BookingPayment) => ['PENDING', 'COMPLETED'].includes(payment.status));
    const selectedBookingPayment = bookingPayments.length ? bookingPayments[0] : null;

    switch (this.type) {
      case 'booking:invoiced':
        const paymentMessage = selectedBookingPayment?.paid ? `<p>Thank you for your payment. We've successfully received it. You can <a href="${selectedBookingPayment?.paymentLink}" target="_blank">click here</a> to view your paid invoice online. Additionally, we've attached the paid invoice to this email.</p>`
          : `<p>You can <a href="${selectedBookingPayment?.paymentLink}" target="_blank">click here</a> to view your invoice and complete the payment online. Additionally, we've attached the invoice to this email for your convenience. Inside the attachment, you'll also find a link to process the payment online.</p>`;
        return {
          subject: 'Your Booking Confirmation with Laser Studio',
          title: 'Your Booking Confirmation with Laser Studio',
          message: `<p>We are pleased to confirm your booking at Laser Studio for tattoo removal services.</p>${bookingScheduleCard} ${paymentMessage}`,
          attachment: selectedBookingPayment?.invoicePdfUrl ?? null,
        };
    }
  }

  /**
   * Generate booking schedule card
   */
  private async generateBookingScheduleCard () {
    try {
      const booking = this.booking;

      let scheduleHtml = '';
      let counter = 1;
      for (const schedule of booking.schedules) {
        const bookingStart = moment(schedule.bookingStart.toString()).format('dddd, Do MMM YY hh:mm a');
        const bookingEnd = moment(schedule.bookingEnd.toString()).format('hh:mm a');

        // console.log(schedule.bookingStart, bookingStart);

        scheduleHtml += `
          <div class="schedule-item">
            <div class="schedule-title">Session ${counter++}</div>
            <div class="schedule-sub-title">ID: ${schedule.did}</div>
            <div class="date-time">${bookingStart} - ${bookingEnd}</div>
          </div>
        `;
      }
      return `
      <div class="booking-card">
        <div class="title">${booking.did} : ${booking.name}</div>
        ${scheduleHtml}
      </div>
    `;
    } catch (error) {
      console.log(error);
      ExceptionHandler.report(error);
      return sendData(false, 500, error);
    }
  }
}
