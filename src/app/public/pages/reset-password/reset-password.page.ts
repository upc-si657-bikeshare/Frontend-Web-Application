import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { identityService } from '../../../../api/identityService';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.css']
})
export class ResetPasswordPage implements OnInit {
  password = '';
  confirmPassword = '';
  email: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      if (!this.email) {
        alert('No se especificó un correo.');
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  async onSubmit() {
    if (!this.password || !this.confirmPassword) {
      alert('Completa todos los campos');
      return;
    }
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      await identityService.forceResetPassword(this.email!, this.password);

      alert('¡Contraseña actualizada exitosamente!');
      this.router.navigate(['/login']);

    } catch (error) {
      console.error('Error:', error);
      alert('Error: El correo no existe o hubo un problema en el servidor.');
    }
  }
}
