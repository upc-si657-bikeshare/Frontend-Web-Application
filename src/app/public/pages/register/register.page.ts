import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { identityService } from '../../../../api/identityService';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.css']
})
export class RegisterPage {
  fullName: string = '';
  email: string = '';
  password: string = '';
  isOwner: boolean = false;
  constructor(private router: Router, public translate: TranslateService) {}

  switchLanguage(language: string) {
    this.translate.use(language);
  }
  async onSubmit() {
    const newUser = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      isOwner: this.isOwner
    };

    try {
      await identityService.register(newUser);
      alert(this.translate.instant('Register.UserRegistered'));
      this.resetForm();
      this.router.navigate(['/login']);

    } catch (error) {
      console.error('Error registering user:', error);
      alert(this.translate.instant('Register.ErrorRegistering'));
    }
  }

  private resetForm() {
    this.fullName = '';
    this.email = '';
    this.password = '';
    this.isOwner = false;
  }
}
