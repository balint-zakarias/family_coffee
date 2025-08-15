import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '@shared/ui/header/header';
import { Footer } from '@shared/ui/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {}