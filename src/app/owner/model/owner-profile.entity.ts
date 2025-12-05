export class OwnerProfile {
  id: number;
  userId: number;
  publicBio: string;
  isVerified: boolean;
  payoutEmail: string;
  bankAccountNumber?: string;
  yapePhoneNumber?: string;

  constructor(data: any = {}) {
    this.id                  = data.id                  || 0;
    this.userId              = data.userId              || 0;
    this.publicBio           = data.publicBio           || '';
    this.isVerified          = data.isVerified          || false;
    this.payoutEmail         = data.payoutEmail         || '';
    this.bankAccountNumber   = data.bankAccountNumber   || '';
    this.yapePhoneNumber     = data.yapePhoneNumber     || '';
  }
}
