import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReservationDialogComponent, ReservationDialogData } from '../../../shared/components/reservation-dialog/reservation-dialog.component';

import { catalogService } from '../../../../api/catalogService';
import { identityService } from '../../../../api/identityService';
import { bookingService } from '../../../../api/bookingService';

interface Bike {
  id: number;
  ownerId: number;
  owner: string;
  ownerPhoto: string;
  type: string;
  costPerMinute: number;
  lat: number;
  lng: number;
  imageUrl: string;
  distance?: number;
}

const FALLBACK_OWNER = 'https://media.istockphoto.com/id/1171169099/es/foto/hombre-con-brazos-cruzados-aislados-sobre-fondo-gris.jpg?s=612x612&w=0&k=20&c=8qDLKdLMm2i8DHXY6crX6a5omVh2IxqrOxJV2QGzgFg=';
const FALLBACK_BIKE  = 'https://www.monark.com.pe/static/monark-pe/uploads/products/images/bicicleta-monark-highlander-xt-aro-29-rojo-negro-01.jpg';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatDialogModule, MatSnackBarModule, DecimalPipe],
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.css']
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) private mapContainer!: ElementRef<HTMLDivElement>;
  private map!: L.Map;
  private markersLayer = L.layerGroup();

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  bikes: Bike[] = [];
  bikeTypes: string[] = [];

  priceLabels = ['Todos', '≤ S/ 0.5', 'S/ 0.5 – 0.8', '> S/ 0.8'];
  priceRanges = [
    { label: 'Todos', min: 0, max: Infinity },
    { label: '≤ S/ 0.5', min: 0, max: 0.5 },
    { label: 'S/ 0.5 – 0.8', min: 0.5, max: 0.8 },
    { label: '> S/ 0.8', min: 0.8, max: Infinity }
  ];

  filteredBikes: Bike[] = [];
  selectedBike: Bike | null = null;
  loading = false;

  ngOnInit(): void {
    this.loadAvailableBikes();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  async loadAvailableBikes() {
    this.loading = true;
    try {
      const bikesData: any[] = await catalogService.getAllBikes({ status: 'AVAILABLE' });
      const enrichedBikes = await Promise.all(bikesData.map(async (b: any) => {
        let ownerName = 'Propietario';
        let ownerPhoto = FALLBACK_OWNER;

        try {
          const profile = await identityService.getProfile(b.ownerId);
          ownerName = profile.fullName;
          ownerPhoto = profile.avatarUrl || FALLBACK_OWNER;
        } catch (e) {
          console.warn(`No se pudo cargar dueño para bici ${b.id}`);
        }

        return {
          id: b.id,
          ownerId: b.ownerId,
          owner: ownerName,
          ownerPhoto: ownerPhoto,
          type: b.type,
          costPerMinute: b.costPerMinute,
          lat: b.latitude,
          lng: b.longitude,
          imageUrl: b.imageUrl || FALLBACK_BIKE
        } as Bike;
      }));

      this.bikes = enrichedBikes;
      this.filteredBikes = [...this.bikes];
      this.bikeTypes = Array.from(new Set(this.bikes.map(b => b.type)));
      this.updateMarkers();
      if (this.bikes.length > 0 && this.map) {
        const bounds = L.latLngBounds(this.bikes.map(b => [b.lat, b.lng]));
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }

    } catch (error) {
      console.error('Error cargando bicicletas:', error);
      this.snackBar.open('Error al cargar el mapa de bicicletas', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  openReservationDialog(): void {
    if (!this.selectedBike) return;

    const dialogData: ReservationDialogData = {
      bikeName: `${this.selectedBike.type} de ${this.selectedBike.owner}`,
      pricePerMinute: this.selectedBike.costPerMinute,
      imageUrl: this.selectedBike.imageUrl
    };

    const dialogRef = this.dialog.open(ReservationDialogComponent, {
      width: '450px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        await this.createReservation();
      }
    });
  }

  async createReservation() {
    const renterIdStr = localStorage.getItem('userId');
    if (!renterIdStr || !this.selectedBike) {
      this.snackBar.open('Debes iniciar sesión para reservar', 'Cerrar');
      return;
    }

    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const reservationPayload = {
        renterId: parseInt(renterIdStr, 10),
        bikeId: this.selectedBike.id,
        startDate: now.toISOString(),
        endDate: oneHourLater.toISOString()
      };

      await bookingService.createReservation(reservationPayload);
      this.snackBar.open(
        `¡Reserva exitosa! Disfruta la ${this.selectedBike.type}.`,
        'OK',
        { duration: 4000 }
      );

      this.selectedBike = null;
      this.loadAvailableBikes();

    } catch (error) {
      console.error('Error creando reserva:', error);
      this.snackBar.open('Error al procesar la reserva', 'Cerrar', { duration: 3000 });
    }
  }

  onOwnerImageError(event: Event) { (event.target as HTMLImageElement).src = FALLBACK_OWNER; }
  onBikeImageError(event: Event) { (event.target as HTMLImageElement).src = FALLBACK_BIKE; }

  private initMap(): void {
    if (!this.mapContainer) return;
    this.map = L.map(this.mapContainer.nativeElement, { center: [-12.09, -77.05], zoom: 14 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(this.map);
    this.markersLayer.addTo(this.map);
  }

  applyFilters(district: string, type: string, priceLabel: string) {
    this.selectedBike = null;
    if (district.trim()) {
      this.searchDistrict(district.trim());
    }

    let list = [...this.bikes];

    if (type) {
      list = list.filter(b => b.type === type);
    }

    const prLabel = priceLabel || 'Todos';
    const pr = this.priceRanges.find(p => p.label === prLabel)!;
    list = list.filter(b => b.costPerMinute >= pr.min && b.costPerMinute < pr.max);

    const center: [number, number] = [this.map.getCenter().lat, this.map.getCenter().lng];
    this.filteredBikes = list
      .map(b => ({ ...b, distance: this.haversine(center, [b.lat, b.lng]) }))
      .sort((a, b) => (a.distance! - b.distance!));

    this.updateMarkers();
  }

  private updateMarkers() {
    this.markersLayer.clearLayers();
    this.filteredBikes.forEach(b => {
      if (b.lat && b.lng) {
        const icon = L.icon({ iconUrl: 'assets/img/map-marker.svg', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
        const marker = L.marker([b.lat, b.lng], { icon }).addTo(this.markersLayer)
          .bindPopup(`<b>${b.owner}</b><br>${b.type} - S/ ${b.costPerMinute}/min`);

        marker.on('click', () => {
          this.ngZone.run(() => {
            this.selectBike(b);
            this.cdr.detectChanges();
          });
        });
      }
    });
  }

  selectBike(b: Bike) {
    this.selectedBike = b;
    if (this.map) {
      this.map.flyTo([b.lat, b.lng], 16);
    }
  }

  private searchDistrict(query: string) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Lima, Peru')}`)
      .then(r => r.json())
      .then((res: any[]) => {
        if (res.length > 0) {
          const lat = parseFloat(res[0].lat);
          const lng = parseFloat(res[0].lon);
          this.map.setView([lat, lng], 14);
        }
      })
      .catch(console.error);
  }

  private haversine([lat1, lon1]: number[], [lat2, lon2]: number[]): number {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
