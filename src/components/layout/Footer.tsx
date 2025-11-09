import { Shield, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">SecuredBank</span>
            </div>
            <p className="text-secondary-300 mb-4 max-w-md">
              Advanced cybersecurity solutions for modern banking. Protecting your financial 
              data with cutting-edge security technology and 24/7 monitoring.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-secondary-300">
                <Mail className="w-4 h-4" />
                <span>support@securedbank.com</span>
              </div>
              <div className="flex items-center space-x-2 text-secondary-300">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-secondary-300">
                <MapPin className="w-4 h-4" />
                <span>123 Security Ave, Cyber City, CC 12345</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="text-secondary-300 hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/security" className="text-secondary-300 hover:text-white transition-colors">
                  Security Monitoring
                </a>
              </li>
              <li>
                <a href="/users" className="text-secondary-300 hover:text-white transition-colors">
                  User Management
                </a>
              </li>
              <li>
                <a href="/reports" className="text-secondary-300 hover:text-white transition-colors">
                  Reports
                </a>
              </li>
              <li>
                <a href="/settings" className="text-secondary-300 hover:text-white transition-colors">
                  Settings
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="/help" className="text-secondary-300 hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/documentation" className="text-secondary-300 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/api" className="text-secondary-300 hover:text-white transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/status" className="text-secondary-300 hover:text-white transition-colors">
                  System Status
                </a>
              </li>
              <li>
                <a href="/contact" className="text-secondary-300 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-secondary-300 text-sm">
              © {currentYear} SecuredBank. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-secondary-300 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-secondary-300 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="/security" className="text-secondary-300 hover:text-white text-sm transition-colors">
                Security Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

