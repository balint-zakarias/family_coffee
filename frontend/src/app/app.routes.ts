import { Routes } from '@angular/router';
import { Home } from '@features/home/home';
import { Cart } from '@features/shop/cart/cart';
import { Webshop } from '@features/shop/webshop/webshop';
import { Product } from '@features/shop/product/product';
import { OrderSuccess } from '@features/shop/order-success/order-success';
import { Privacy } from '@features/legal/pages/privacy/privacy';
import { Login } from '@features/auth/pages/login/login';
import { Dashboard } from '@features/dashboard/pages/dashboard/dashboard';
import { Products } from '@features/dashboard/pages/products/products';
import { ProductForm } from '@features/dashboard/pages/product-form/product-form';
import { Orders } from '@features/dashboard/pages/orders/orders';
import { Settings } from '@features/dashboard/pages/settings/settings';
import { Content } from '@features/dashboard/pages/content/content';
import { Categories } from '@features/dashboard/pages/categories/categories';
import { ContactForms } from '@features/dashboard/pages/contact-forms/contact-forms';

export const routes: Routes = [
  { path: '', component: Home, title: 'FamilyCoffee – Kezdőlap' },
  { path: 'shop', component: Webshop, title: 'Webshop' },
  { path: 'shop/product/:slug', component: Product, title: 'Termék – FamilyCoffee' },
  { path: 'cart', component: Cart, title: 'Kosár' },
  { path: 'order-success', component: OrderSuccess, title: 'Rendelés leadva – FamilyCoffee' },
  { path: 'privacy', component: Privacy, title: 'Adatvédelmi nyilatkozat – FamilyCoffee' },
  { path: 'login', component: Login, title: 'Bejelentkezés – FamilyCoffee Admin' },
  { path: 'dashboard', component: Dashboard, title: 'Dashboard – FamilyCoffee Admin' },
  { path: 'dashboard/products', component: Products, title: 'Termékek – FamilyCoffee Admin' },
  { path: 'dashboard/products/new', component: ProductForm, title: 'Új termék – FamilyCoffee Admin' },
  { path: 'dashboard/products/:slug/edit', component: ProductForm, title: 'Termék szerkesztése – FamilyCoffee Admin' },
  { path: 'dashboard/products/:slug/view', component: ProductForm, title: 'Termék megtekintése – FamilyCoffee Admin' },
  { path: 'dashboard/orders', component: Orders, title: 'Rendelések – FamilyCoffee Admin' },
  { path: 'dashboard/settings', component: Settings, title: 'Beállítások – FamilyCoffee Admin' },
  { path: 'dashboard/content', component: Content, title: 'Tartalom – FamilyCoffee Admin' },
  { path: 'dashboard/categories', component: Categories, title: 'Kategóriák – FamilyCoffee Admin' },
  { path: 'dashboard/contact-forms', component: ContactForms, title: 'Kapcsolat üzenetek – FamilyCoffee Admin' },
  { path: '**', redirectTo: '' },
];