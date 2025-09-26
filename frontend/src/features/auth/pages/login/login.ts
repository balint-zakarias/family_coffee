import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
  error?: string;
}

@Component({
  selector: 'page-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  email = signal<string>('');
  password = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private readonly API_URL = `${environment.apiUrl}/api/auth/login/`;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  async onSubmit() {
    if (!this.email().trim() || !this.password().trim()) {
      this.error.set('Kérjük, töltse ki az összes mezőt!');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('Bejelentkezési kísérlet:', { email: this.email().trim() });

      const response = await this.http.post<LoginResponse>(this.API_URL, {
        email: this.email().trim(),
        password: this.password().trim()
      }).toPromise();

      if (response && response.success === true && response.user) {
        console.log('Sikeres bejelentkezés:', {
          username: response.user.username,
          email: response.user.email,
          is_staff: response.user.is_staff
        });
        
        localStorage.setItem('familycoffee_user', JSON.stringify(response.user));
        
        this.router.navigate(['/dashboard']);
        
      } else {
        const errorMessage = response?.error || 'Bejelentkezési hiba történt';
        this.error.set(errorMessage);
        console.log('Bejelentkezés sikertelen:', errorMessage);
      }
      
    } catch (error) {
      console.error('Bejelentkezési hiba:', error);
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          this.error.set('Nem sikerült kapcsolódni a szerverhez. Ellenőrizze, hogy a backend fut-e.');
        } else if (error.error?.error) {
          this.error.set(error.error.error);
        } else if (error.status === 401) {
          this.error.set('Hibás e-mail cím vagy jelszó.');
        } else if (error.status === 403) {
          this.error.set('Nincs jogosultsága az adminisztrációs felület használatához.');
        } else {
          this.error.set(`Szerver hiba (${error.status}): ${error.message}`);
        }
      } else {
        this.error.set('Váratlan hiba történt a bejelentkezés során.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  onEmailChange(value: string) {
    this.email.set(value);
    if (this.error()) {
      this.error.set(null);
    }
  }

  onPasswordChange(value: string) {
    this.password.set(value);
    if (this.error()) {
      this.error.set(null);
    }
  }
}
