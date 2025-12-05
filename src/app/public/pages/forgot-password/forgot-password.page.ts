import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.css']
})
export class ForgotPasswordPage {
  email = '';

  constructor(private router: Router) {}

  onSubmit() {
    if (!this.email || !this.email.includes('@')) {
      alert('Ingresa un correo válido');
      return;
    }
    this.router.navigate(['/reset-password'], { queryParams: { email: this.email } });
  }

  onCancel() {
    this.router.navigate(['/login']);
  }
}
