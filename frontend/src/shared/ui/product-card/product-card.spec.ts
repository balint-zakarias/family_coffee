import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCard } from './product-card';

describe('ProductCard Integration', () => {
  let component: ProductCard;
  let fixture: ComponentFixture<ProductCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCard);
    component = fixture.componentInstance;
  });

  it('should display regular product price', () => {
    component.product = {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      price: 1000,
      onlyForRent: false
    };
    fixture.detectChanges();

    const priceElement = fixture.nativeElement.querySelector('.price');
    expect(priceElement.textContent).toContain('1,000 Ft');
    expect(priceElement.textContent).not.toContain('/ hó');
  });

  it('should display rental product price with /hó suffix', () => {
    component.product = {
      id: '1',
      name: 'Rental Product',
      slug: 'rental-product',
      price: 500,
      onlyForRent: true
    };
    fixture.detectChanges();

    const priceElement = fixture.nativeElement.querySelector('.price');
    expect(priceElement.textContent).toContain('500 Ft / hó');
  });

  it('should emit addToCart event when button clicked', () => {
    spyOn(component.addToCart, 'emit');
    component.product = {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      price: 1000
    };
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.cart');
    button.click();

    expect(component.addToCart.emit).toHaveBeenCalledWith(component.product);
  });
});
