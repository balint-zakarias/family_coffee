import { Routes } from '@angular/router';
import { Home } from '@features/shop/pages/home/home';
import { List } from '@features/shop/pages/list/list';
import { Cart } from '@features/shop/pages/cart/cart';

export const routes: Routes = [
  { path: '', component: Home, title: 'FamilyCoffee – Kezdőlap' },
  { path: 'shop', component: List, title: 'Termékek' },
  { path: 'cart', component: Cart, title: 'Kosár' },
  { path: '**', redirectTo: '' },
];