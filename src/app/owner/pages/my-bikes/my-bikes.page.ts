import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';

import { BikeFormComponent } from '../../components/bike-form/bike-form.component';
import { Bike } from '../../model/bike.entity';
import { catalogService } from '../../../../api/catalogService';

@Component({
  selector: 'app-my-bikes-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, TranslateModule, BikeFormComponent],
  templateUrl: './my-bikes.page.html',
  styleUrls: ['./my-bikes.page.css']
})
export class MyBikesPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer') set mapContainer(container: ElementRef | undefined) {
    if (container) {
      this._mapContainer = container;
      setTimeout(() => this.initMap(), 0);
    }
  }
  private _mapContainer!: ElementRef;

  private map!: L.Map;
  private markersLayer = L.layerGroup();

  myBikes: Bike[] = [];
  selectedBike: Bike | null = null;
  isEditing = false;
  currentUserId: number = 0;

  private bikeIcon = L.icon({
    iconUrl: 'assets/img/map-marker.svg',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -40]
  });

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) {
      this.currentUserId = parseInt(userIdStr, 10);
      this.loadOwnerBikes();
    } else {
      console.error('No se encontró userId. Usuario no logueado.');
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
  async loadOwnerBikes() {
    try {
      const data = await catalogService.getAllBikes({ ownerId: this.currentUserId });
      this.myBikes = data.map((b: any) => new Bike(b));
      if (this.map) {
        this.updateMarkers();
      }
    } catch (error) {
      console.error('Error cargando bicicletas:', error);
    }
  }

  initMap(): void {
    if (this.map) this.map.remove();
    if (!this._mapContainer) return;

    this.map = L.map(this._mapContainer.nativeElement).setView([-12.09, -77.05], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.updateMarkers();
  }

  updateMarkers(): void {
    this.markersLayer.clearLayers();
    this.myBikes.forEach(bike => {
      if (bike.lat && bike.lng) {
        L.marker([bike.lat, bike.lng], { icon: this.bikeIcon })
          .addTo(this.markersLayer)
          .bindPopup(`<b>${bike.model}</b><br>${bike.type}`);
      }
    });
  }

  selectBike(bike: Bike): void {
    this.selectedBike = bike;
    if (this.map && bike.lat && bike.lng) {
      this.map.flyTo([bike.lat, bike.lng], 16);
    }
  }

  showAddForm(): void {
    this.selectedBike = null;
    this.isEditing = true;
  }

  showEditForm(bike: Bike): void {
    this.selectedBike = bike;
    this.isEditing = true;
  }
  async handleFormSubmit(formData: any) {
    try {
      if (this.selectedBike) {
        const updatePayload = {
          model: formData.model,
          type: formData.type,
          costPerMinute: formData.costPerMinute,
          imageUrl: formData.imageUrl,
          latitude: formData.lat,
          longitude: formData.lng,
          status: 'AVAILABLE'
        };

        await catalogService.updateBike(this.selectedBike.id, updatePayload);
        console.log('Bicicleta actualizada exitosamente');

      } else {
        const createPayload = {
          ownerId: this.currentUserId,
          model: formData.model,
          type: formData.type,
          costPerMinute: formData.costPerMinute,
          imageUrl: formData.imageUrl,
          latitude: formData.lat,
          longitude: formData.lng
        };

        await catalogService.createBike(createPayload);
        console.log('Nueva bicicleta creada exitosamente');
      }
      this.isEditing = false;
      await this.loadOwnerBikes();

    } catch (error) {
      console.error('Error guardando bicicleta:', error);
      alert('Hubo un error al guardar la bicicleta. Revisa la consola.');
    }
  }

  handleFormCancel(): void {
    this.isEditing = false;
  }
}
