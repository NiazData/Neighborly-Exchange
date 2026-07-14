import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Search, MessageSquare, Users, Settings, Menu, X, 
  Map, HandHeart, ArrowLeftRight, Bell, Shield, LogOut,
  ChevronDown, User as UserIcon, Star, FileText, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const translations = {
  en: {
    home: 'Home',
    explore: 'Explore Skills',
    mySkills: 'My Skills',
    exchanges: 'Exchanges',
    messages: 'Messages',
    map: 'Nearby Map',
    profile: 'Profile',
    admin: 'Admin',
    logout: 'Logout',
    terms: 'Terms',
    privacy: 'Privacy',
    verified: 'Verified'
  },
  es: {
    home: 'Inicio',
    explore: 'Explorar Habilidades',
    mySkills: 'Mis Habilidades',
    exchanges: 'Intercambios',
    messages: 'Mensajes',
    map: 'Mapa Cercano',
    profile: 'Perfil',
    admin: 'Admin',
    logout: 'Cerrar sesión',
    terms: 'Términos',
    privacy: 'Privacidad',
    verified: 'Verificado'
  },
  fr: {
    home: 'Accueil',
    explore: 'Explorer les Compétences',
    mySkills: 'Mes Compétences',
    exchanges: 'Échanges',
    messages: 'Messages',
    map: 'Carte Proche',
    profile: 'Profil',
    admin: 'Admin',
    logout: 'Déconnexion',
    terms: 'Conditions',
    privacy: 'Confidentialité',
    verified: 'Vérifié'
  },
  ar: {
    home: 'الرئيسية',
    explore: 'استكشف المهارات',
    mySkills: 'مهاراتي',
    exchanges: 'التبادلات',
    messages: 'الرسائل',
    map: 'الخريطة القريبة',
    profile: 'الملف الشخصي',
    admin: 'المشرف',
    logout: 'تسجيل الخروج',
    terms: 'الشروط',
    privacy: 'الخصوصية',
    verified: 'موثق'
  }
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();
  
  const lang = user?.preferred_language || 'en';
  const t = translations[lang] || translations.en;
  const isRTL = lang === 'ar';

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log('Not logged in');
    }
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    try {
      const messages = await base44.entities.Message.filter({ receiver_id: user.id, read: false });
      setUnreadMessages(messages.length);
    } catch (e) {}
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = [
    { name: t.home, icon: Home, page: 'Home' },
    { name: t.explore, icon: Search, page: 'Explore' },
    { name: t.mySkills, icon: HandHeart, page: 'MySkills' },
    { name: t.exchanges, icon: ArrowLeftRight, page: 'Exchanges' },
    { name: t.messages, icon: MessageSquare, page: 'Messages', badge: unreadMessages },
    { name: t.map, icon: Map, page: 'NearbyMap' },
  ];

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 hidden sm:block">NeighborSkill</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    currentPageName === item.page
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  {item.badge > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{item.badge}</Badge>
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to={createPageUrl('Admin')}>
                      <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-amber-600 hover:bg-amber-50">
                        <Shield className="w-4 h-4" />
                        {t.admin}
                      </Button>
                    </Link>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {user.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm font-medium text-slate-700">{user.full_name?.split(' ')[0]}</span>
                        {user.is_verified && (
                          <Badge variant="secondary" className="hidden sm:flex bg-blue-50 text-blue-600 text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            {t.verified}
                          </Badge>
                        )}
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))}>
                        <UserIcon className="w-4 h-4 mr-2" />
                        {t.profile}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t.logout}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={isRTL ? "right" : "left"} className="w-72">
                  <div className="flex flex-col gap-2 mt-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        onClick={() => setMobileOpen(false)}
                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                          currentPageName === item.page
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                        {item.badge > 0 && (
                          <Badge className="bg-red-500 text-white ml-auto">{item.badge}</Badge>
                        )}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link
                        to={createPageUrl('Admin')}
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-3 rounded-lg font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-3"
                      >
                        <Shield className="w-5 h-5" />
                        {t.admin}
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-700">NeighborSkill</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link to={createPageUrl('Terms')} className="hover:text-emerald-600 transition-colors">
                {t.terms}
              </Link>
              <Link to={createPageUrl('Privacy')} className="hover:text-emerald-600 transition-colors">
                {t.privacy}
              </Link>
              <Link to={createPageUrl('Legal')} className="hover:text-emerald-600 transition-colors">
                Legal
              </Link>
            </div>
            <p className="text-sm text-slate-400">© 2026 NeighborSkill</p>
          </div>
        </div>
      </footer>
    </div>
  );
}