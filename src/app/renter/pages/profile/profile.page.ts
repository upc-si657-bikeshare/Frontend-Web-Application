import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrentUser, CurrentUserService } from '../../../shared/services/current-user.service';
import { ReviewsDialogComponent } from '../../../shared/components/reviews-dialog/reviews-dialog.component';
import { ChangePasswordDialogComponent } from '../../../shared/components/change-password-dialog/change-password-dialog.component';
import { identityService } from '../../../../api/identityService';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule, TranslateModule, MatDialogModule ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css']
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private currentUserService = inject(CurrentUserService);

  userData: CurrentUser | null = null;
  renterProfileData: any = {};

  personalInfoForm: FormGroup;
  preferencesForm: FormGroup;

  personalInfoEditMode = false;
  passwordVisible = false;
  currentPasswordMock = '••••••••';

  paymentMethods = ['Profile.Payment.Yape', 'Profile.Payment.Paypal', 'Profile.Payment.Debit', 'Profile.Payment.Credit'];
  bikeTypes = ['Profile.BikeType.Any', 'Profile.BikeType.Vintage', 'Profile.BikeType.BMX', 'Profile.BikeType.Sport', 'Profile.BikeType.Mountain'];

  reviewsMade: any[] = [];
  stars = Array(5).fill(0);

  constructor() {
    this.personalInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['', Validators.required],
      avatar: ['']
    });

    this.preferencesForm = this.fb.group({
      paymentMethod: [''],
      preferredBikeType: [''],
      notifications: [true]
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private async loadInitialData() {
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) return;

    const userId = parseInt(userIdStr, 10);

    try {
      const profile = await identityService.getProfile(userId);
      this.renterProfileData = profile;
      this.personalInfoForm.patchValue({
        name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        avatar: profile.avatarUrl
      });

      this.preferencesForm.patchValue({
        paymentMethod: profile.paymentMethod || 'Profile.Payment.Paypal',
        preferredBikeType: profile.preferredBikeType || 'Profile.BikeType.Any',
        notifications: profile.notificationsEnabled !== undefined ? profile.notificationsEnabled : true
      });
      this.currentUserService.updateCurrentUser({
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        avatar: profile.avatarUrl,
        phone: profile.phone,
        publicBio: profile.publicBio,
        address: profile.address
      });

      this.currentUserService.currentUser$.subscribe(user => this.userData = user);

    } catch (error) {
      console.error('Error cargando perfil:', error);
      this.snackBar.open(this.translate.instant('Profile.ErrorLoad'), 'OK', { duration: 3000 });
    }

    this.reviewsMade = [
      { ownerName: 'Ana', bikeModel: 'BMX Pro', rating: 5, comment: 'La bici de Ana es increíble, muy buen estado.', date: 'Hace 1 semana', ownerImage: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { ownerName: 'Luis', bikeModel: 'Vintage Verde', rating: 4, comment: 'Todo bien con el alquiler, proceso fácil.', date: 'Hace 3 semanas', ownerImage: 'https://randomuser.me/api/portraits/men/40.jpg' },
      { ownerName: 'Carla', bikeModel: 'Mountain X', rating: 4.5, comment: 'Perfecta para el cerro. Carla fue muy amable.', date: 'Hace 1 mes', ownerImage: 'https://randomuser.me/api/portraits/women/50.jpg' }
    ];

    this.personalInfoForm.disable();
    this.preferencesForm.disable();
  }

  onChangeProfilePicture(): void {
    if (!this.personalInfoEditMode) return;
    const promptMessage = this.translate.instant('Profile.ChangePicturePrompt');
    const newImageUrl = prompt(promptMessage, this.personalInfoForm.get('avatar')?.value || '');

    if (newImageUrl && newImageUrl.trim() !== '') {
      this.personalInfoForm.patchValue({ avatar: newImageUrl });
    }
  }

  toggleEditPersonalInfo() {
    if (this.personalInfoEditMode) {
      this.saveAllData();
    } else {
      this.personalInfoForm.enable();
      this.preferencesForm.enable();
      this.personalInfoForm.get('email')?.disable();

      this.personalInfoEditMode = true;
    }
  }

  cancelEditPersonalInfo() {
    this.personalInfoEditMode = false;
    this.loadInitialData();
  }

  private async saveAllData() {
    if (this.personalInfoForm.invalid || this.preferencesForm.invalid || !this.userData) {
      this.snackBar.open(this.translate.instant('Profile.ErrorForm'),
        this.translate.instant('Profile.Close'),
        { duration: 3000 });
      return;
    }

    try {
      const userId = this.userData.id;
      const personalValues = this.personalInfoForm.getRawValue();
      const preferenceValues = this.preferencesForm.value;
      const updatePayload = {
        fullName: personalValues.name,
        phone: personalValues.phone,
        address: personalValues.address,
        avatarUrl: personalValues.avatar,
        paymentMethod: preferenceValues.paymentMethod,
        preferredBikeType: preferenceValues.preferredBikeType,
        notificationsEnabled: preferenceValues.notifications
      };
      await identityService.updateRenterProfile(userId, updatePayload);
      this.snackBar.open(this.translate.instant('Profile.Saved'),
        this.translate.instant('Profile.OK'),
        { duration: 2000 });

      this.personalInfoEditMode = false;
      this.loadInitialData();

    } catch (error) {
      console.error('Error guardando perfil:', error);
      this.snackBar.open(this.translate.instant('Profile.ErrorSave'), 'Cerrar', { duration: 3000 });
    }
  }

  openChangePasswordDialog() {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, { width: '400px', disableClose: true });
    dialogRef.afterClosed().subscribe((result: { newPassword?: string } | undefined) => {
      if (result && result.newPassword) {
        this.snackBar.open('Cambio de contraseña no implementado en backend', 'OK', { duration: 3000 });
      }
    });
  }

  openReviewsDialog() {
    const dialogData = {
      title: 'Profile.MyReviews',
      reviews: this.reviewsMade.map(review => ({
        reviewerName: review.ownerName,
        reviewerImage: review.ownerImage,
        reviewSubject: review.bikeModel,
        date: review.date,
        comment: review.comment,
        rating: review.rating
      }))
    };
    this.dialog.open(ReviewsDialogComponent, { width: '600px', data: dialogData });
  }

  getStarType(rating: number, index: number): string {
    if (rating >= index) return 'star';
    else if (rating >= index - 0.5) return 'star_half';
    else return 'star_border';
  }
}
