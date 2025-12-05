import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupportTicketDialogComponent } from '../../../shared/components/support-ticket-dialog/support-ticket-dialog.component';
import { supportService } from '../../../../api/supportService';

@Component({
  selector: 'app-owner-support-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './owner-support.page.html',
  styleUrls: ['./owner-support.page.css']
})
export class OwnerSupportPage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);

  supportTickets: any[] = [];

  newRequestForm: FormGroup;
  categories: string[] = [
    'Pagos',
    'Incidente',
    'Cuenta',
    'Sugerencias',
    'Otro'
  ];
  selectedFileName: string | null = null;

  constructor() {
    this.newRequestForm = this.fb.group({
      asunto: ['', Validators.required],
      categoria: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.minLength(20)]],
      archivo: [null]
    });
  }

  ngOnInit(): void {
    this.loadTickets();
  }

  async loadTickets() {
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) return;
    const userId = parseInt(userIdStr, 10);

    try {
      const data: any[] = await supportService.getTickets(userId);
      this.supportTickets = data.map(ticket => ({
        id: ticket.id,
        asunto: ticket.subject,
        fecha: new Date(ticket.createdAt).toLocaleDateString(),
        estado: ticket.status,
        mensaje: ticket.message,
        categoria: ticket.category
      }));

    } catch (error) {
      console.error('Error cargando tickets:', error);
    }
  }

  async onSubmit() {
    if (this.newRequestForm.valid) {
      const userIdStr = localStorage.getItem('userId');
      if (!userIdStr) {
        this.snackBar.open('Error de sesión', 'Cerrar');
        return;
      }

      try {
        const formValue = this.newRequestForm.value;
        const ticketData = {
          userId: parseInt(userIdStr, 10),
          subject: formValue.asunto,
          category: formValue.categoria,
          message: formValue.mensaje
        };
        await supportService.createTicket(ticketData);
        this.snackBar.open(this.translate.instant('Support.Success'), 'OK', { duration: 3000 });
        this.newRequestForm.reset();
        this.selectedFileName = null;
        Object.keys(this.newRequestForm.controls).forEach(key => {
          this.newRequestForm.get(key)?.setErrors(null);
        });
        this.loadTickets();

      } catch (error) {
        console.error('Error creando ticket:', error);
        this.snackBar.open(this.translate.instant('Support.ErrorGeneric'), 'Cerrar', { duration: 3000 });
      }

    } else {
      this.snackBar.open(this.translate.instant('Support.ErrorRequired'), 'Cerrar', { duration: 3000 });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newRequestForm.patchValue({ archivo: file });
      this.selectedFileName = file.name;
    }
  }

  viewDetails(ticketId: number): void {
    const ticketData = this.supportTickets.find(ticket => ticket.id === ticketId);

    if (ticketData) {
      this.dialog.open(SupportTicketDialogComponent, {
        width: '550px',
        data: ticketData,
        panelClass: 'custom-dialog-container'
      });
    }
  }
  translateStatus(estado: string): string {
    switch (estado) {
      case 'OPEN': return this.translate.instant('Support.StatusOpen') || 'Abierto';
      case 'IN_PROGRESS': return this.translate.instant('Support.StatusInProgress');
      case 'RESOLVED': return this.translate.instant('Support.StatusResolved');
      case 'CLOSED': return this.translate.instant('Support.StatusClosed');
      default: return estado;
    }
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'RESOLVED': return 'status-resolved';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'CLOSED': return 'status-closed';
      case 'OPEN': return 'status-open';
      default: return '';
    }
  }
}
