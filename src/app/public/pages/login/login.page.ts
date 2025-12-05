import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { identityService } from '../../../../api/identityService';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css']
})
export class LoginPage {
  email = '';
  password = '';
  constructor(private router: Router, public translate: TranslateService) {}

  switchLanguage(language: string) {
    this.translate.use(language);
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      alert(this.translate.instant('Login.ErrorEmptyFields'));
      return;
    }

    try {
      const response = await identityService.login(this.email, this.password);

      console.log('Login exitoso:', response);

      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      if (response.userId) {
        localStorage.setItem('userId', response.userId.toString());
      }

      const isOwner = response.isOwner;
      localStorage.setItem('userRole', isOwner ? 'owner' : 'renter');

      this.router.navigate([ isOwner ? '/owner/home' : '/renter/home' ]);

    } catch (error) {
      console.error('Error login:', error);
      alert(this.translate.instant('Login.WrongPassword'));
    }
  }
}
