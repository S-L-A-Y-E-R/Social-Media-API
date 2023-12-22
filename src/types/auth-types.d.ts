export interface IProfileGoogle {
  provider: string;
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  given_name: string;
  family_name: string;
  email_verified: boolean;
  verified: boolean;
  language: string;
  locale: string | undefined;
  email: string;
  emails: { value: string; type: string }[];
  photos: { value: string; type: string }[];
  picture: string;
  _json: {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
    email: string;
    email_verified: boolean;
    verified: boolean;
  };
}
