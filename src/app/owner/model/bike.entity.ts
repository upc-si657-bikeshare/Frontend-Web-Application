export class Bike {
  id: number;
  model: string;
  type: string;
  rentalsThisMonth: number;
  imageUrl: string;
  lat: number;
  lng: number;
  costPerMinute: number;
  status: string;

  constructor(data: any = {}) {
    this.id = data.id || 0;
    this.model = data.model || '';
    this.type = data.type || '';
    this.rentalsThisMonth = 0;
    this.imageUrl = data.imageUrl || '';
    this.costPerMinute = data.costPerMinute || 0;
    this.status = data.status || 'AVAILABLE';
    this.lat = data.latitude !== undefined ? data.latitude : (data.lat || 0);
    this.lng = data.longitude !== undefined ? data.longitude : (data.lng || 0);
  }
}
