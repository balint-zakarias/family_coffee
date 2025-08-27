import { Routes } from '@angular/router';
import { Home } from '@features/shop/pages/home/home';
import { List } from '@features/shop/pages/list/list';
import { Cart } from '@features/shop/pages/cart/cart';
import { Webshop } from '@features/shop/pages/webshop/webshop';
import { Privacy } from '@features/legal/pages/privacy/privacy';
import { Login } from '@features/auth/pages/login/login';
import { Dashboard } from '@features/dashboard/pages/dashboard/dashboard';
import { Products } from '@features/dashboard/pages/products/products';

export const routes: Routes = [
  { path: '', component: Home, title: 'FamilyCoffee – Kezdőlap' },
  { path: 'shop', component: Webshop, title: 'Webshop' },
  { path: 'cart', component: Cart, title: 'Kosár' },
  { path: 'privacy', component: Privacy, title: 'Adatvédelmi nyilatkozat – FamilyCoffee' },
  { path: 'login', component: Login, title: 'Bejelentkezés – FamilyCoffee Admin' },
  { path: 'dashboard', component: Dashboard, title: 'Dashboard – FamilyCoffee Admin' },
  { path: 'dashboard/products', component: Products, title: 'Termékek – FamilyCoffee Admin' },
  { path: '**', redirectTo: '' },
];