export class Reservation {
  id: number;
  renterName: string;
  bikeName: string;
  date: Date;
  endDate?: Date;
  status: string;
  totalPrice: number;
  renterImage: string;

  constructor(data: any = {}) {
    this.id = data.id || 0;
    this.renterName = data.renterName || 'Unknown';
    this.bikeName = data.bikeName || 'Bike';
    this.date = data.date ? new Date(data.date) : new Date();
    this.endDate = data.endDate ? new Date(data.endDate) : undefined;
    this.status = data.status || 'PENDING';
    this.totalPrice = data.totalPrice || 0;
    this.renterImage = data.renterImage || '';
  }
}
