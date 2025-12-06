import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { Bike } from '../../model/bike.entity';

@Component({
  selector: 'app-bike-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    MatIconModule
  ],
  templateUrl: './bike-form.component.html',
  styleUrls: ['./bike-form.component.css']
})
export class BikeFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() bikeToEdit: Bike | null = null;
  @Output() formSubmitted = new EventEmitter<any>();
  @Output() formCancelled = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  @ViewChild('formMapContainer') private formMapContainer!: ElementRef;
  private map!: L.Map;
  private marker: L.Marker | null = null;

  bikeForm: FormGroup;

  bikeTypes = [
    { value: 'URBANA', label: 'Urbana' },
    { value: 'MTB', label: 'Montañera' },
    { value: 'ROAD', label: 'Deportiva / Ruta' },
    { value: 'EBIKE', label: 'Eléctrica' }
  ];

  constructor(private fb: FormBuilder) {
    this.bikeForm = this.fb.group({
      model: ['', Validators.required],
      type: ['', Validators.required],
      costPerMinute: [null, [Validators.required, Validators.min(0.1)]],
      imageUrl: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.bikeToEdit) {
      this.bikeForm.patchValue({
        model: this.bikeToEdit.model,
        type: this.bikeToEdit.type,
        costPerMinute: this.bikeToEdit.costPerMinute,
        imageUrl: this.bikeToEdit.imageUrl,
        lat: this.bikeToEdit.lat,
        lng: this.bikeToEdit.lng
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  initMap(): void {
    if (!this.formMapContainer) return;
    const initialCoords: L.LatLngTuple = (this.bikeToEdit && this.bikeToEdit.lat && this.bikeToEdit.lng)
      ? [this.bikeToEdit.lat, this.bikeToEdit.lng]
      : [-12.09, -77.05];

    this.map = L.map(this.formMapContainer.nativeElement).setView(initialCoords, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    if (this.bikeToEdit) {
      this.updateMarker(initialCoords);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const coords: L.LatLngTuple = [e.latlng.lat, e.latlng.lng];
      this.bikeForm.patchValue({ lat: e.latlng.lat, lng: e.latlng.lng });
      this.bikeForm.markAsDirty();
      this.updateMarker(coords);
    });
  }

  updateMarker(coords: L.LatLngTuple): void {
    if (this.marker) {
      this.marker.setLatLng(coords);
    } else {
      this.marker = L.marker(coords).addTo(this.map);
    }
  }

  onSubmit(): void {
    if (this.bikeForm.valid) {
      this.formSubmitted.emit(this.bikeForm.value);
    }
  }

  onCancel(): void {
    this.formCancelled.emit();
  }

  onDelete(): void {
    this.deleteRequested.emit();
  }

  checkError(controlName: string, errorName: string): boolean {
    return this.bikeForm.get(controlName)?.hasError(errorName) || false;
  }

  get formattedLat(): string {
    const val = this.bikeForm.get('lat')?.value;
    return (val !== null && val !== undefined && !isNaN(val)) ? Number(val).toFixed(4) : 'N/A';
  }

  get formattedLng(): string {
    const val = this.bikeForm.get('lng')?.value;
    return (val !== null && val !== undefined && !isNaN(val)) ? Number(val).toFixed(4) : 'N/A';
  }
}
