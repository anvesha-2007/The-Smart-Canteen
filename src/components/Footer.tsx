import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#FAF5EE] border-t border-[#E7DFD3] text-stone-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="font-display text-xl font-extrabold text-stone-900">
              Smart <span className="text-orange-600">Canteen</span>
            </Link>
            <p className="mt-3 text-sm text-stone-600 max-w-md leading-relaxed">
              Campus digital dining platform built for students and faculty. Browse today&apos;s
              fresh kitchen menu, order between lectures, pay Cash at Counter, and pick up with zero
              queue time.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/menu" className="hover:text-orange-600 transition-colors">
                  Browse Full Menu
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-orange-600 transition-colors">
                  Track My Orders
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-orange-600 transition-colors">
                  Counter Checkout
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-orange-600 transition-colors">
                  Canteen Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3">Campus Contact</h3>
            <ul className="space-y-2.5 text-sm text-stone-600">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>Central Student Plaza, Ground Floor, Main Campus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Mon – Sat · 7:30 AM – 8:30 PM</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="tabular-nums">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                <span>canteen@campus.edu.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E7DFD3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Smart Canteen · University Campus Dining</p>
          <p>Payment Method: Cash at Counter upon Pickup</p>
        </div>
      </div>
    </footer>
  );
}
