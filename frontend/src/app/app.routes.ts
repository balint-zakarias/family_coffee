import { Routes } from '@angular/router';
import { Home } from '@features/shop/pages/home/home';
import { List } from '@features/shop/pages/list/list';
import { Cart } from '@features/shop/pages/cart/cart';
import { Webshop } from '@features/shop/pages/webshop/webshop';

export const routes: Routes = [
  { path: '', component: Home, title: 'FamilyCoffee – Kezdőlap' },
  { path: 'shop', component: Webshop, title: 'Webshop' },
  { path: 'cart', component: Cart, title: 'Kosár' },
  { path: '**', redirectTo: '' },
];