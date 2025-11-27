import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Category, Product } from '@/types';
import { productService } from '@/services/firebase';

const { width } = Dimensions.get('window');

const mockCategories: Category[] = [
  { id: '1', name: 'Vegetables', icon: 'leaf-outline', itemCount: '500+ items', color: '#4CAF50' },
  { id: '2', name: 'Fruits', icon: 'nutrition-outline', itemCount: '300+ items', color: '#FF9800' },
  { id: '3', name: 'Grains', icon: 'restaurant-outline', itemCount: '150+ items', color: '#8D6E63' },
  { id: '4', name: 'Herbs', icon: 'flower-outline', itemCount: '80+ items', color: '#4CAF50' },
  { id: '5', name: 'Dairy', icon: 'water-outline', itemCount: '120+ items', color: '#2196F3' },
  { id: '6', name: 'Organic', icon: 'leaf-outline', itemCount: '400+ items', color: '#4CAF50' },
];

// Function to get translated category name
const getTranslatedCategoryName = (categoryName: string, translations: any, language: string) => {
  switch (categoryName.toLowerCase()) {
    case 'vegetables': return translations.vegetables;
    case 'fruits': return translations.fruits;
    case 'grains': return translations.grains;
    case 'herbs': return translations.herbs;
    case 'dairy': return translations.dairy;
    case 'organic': return translations.organic;
    default: return categoryName;
  }
};

// Function to get translated item count
const getTranslatedItemCount = (itemCount: string, language: string) => {
  if (language === 'bn') {
    return itemCount.replace('items', 'আইটেম').replace('+', '+');
  }
  return itemCount;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout, user } = useAuth();
  const { language, toggleLanguage, translations } = useLanguage();
  const { addToCart, getCartItemCount } = useCart();

  // Function to refresh products
  const refreshProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProducts = await productService.getAllProducts();
      setProducts(fetchedProducts as Product[]);
    } catch (err: any) {
      console.error('Error refreshing products:', err);
      setError('Failed to refresh products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get existing products
        let fetchedProducts = await productService.getAllProducts();
        
        // If no products exist, add sample products
        if (fetchedProducts.length === 0) {
          console.log('No products found, adding sample products...');
          await productService.addSampleProducts();
          fetchedProducts = await productService.getAllProducts();
        }
        
        setProducts(fetchedProducts as Product[]);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
        // Fallback to empty array if fetch fails
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCategoryPress = (category: Category) => {
    // Navigation is now handled by the CategoryCard component
    console.log('Category selected:', category.name);
  };

  const handleProductPress = (product: Product) => {
    Alert.alert('Product Selected', `You selected ${product.name} - $${product.price}`);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'View cart':
        router.push('/cart');
        break;
      case 'Add new product':
        router.push('/add-product');
        break;
      case 'View orders':
        router.push('/(tabs)/orders');
        break;
      case 'View messages':
        Alert.alert('Messages', 'Coming Soon!');
        break;
      default:
        Alert.alert('Quick Action', `You selected: ${action}`);
        break;
    }
  };

  const renderCategoryItem = (category: Category) => {
    const translatedCategory = {
      ...category,
      name: getTranslatedCategoryName(category.name, translations, language),
      itemCount: getTranslatedItemCount(category.itemCount || '', language)
    };
    
    return (
      <CategoryCard
        key={category.id}
        {...translatedCategory}
        onPress={handleCategoryPress}
      />
    );
  };

  const renderProductItem = (product: Product) => (
    <ProductCard
      key={product.id}
      {...product}
      onPress={handleProductPress}
      showAddToCart={true}
      onAddToCart={addToCart}
    />
  );

  const renderProductsContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <ThemedText style={styles.loadingText}>{translations.loading}</ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={refreshProducts}>
            <ThemedText style={styles.retryButtonText}>{translations.tryAgain}</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={48} color="#999" />
          <ThemedText style={styles.emptyText}>{translations.noProductsFound}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={refreshProducts}>
            <ThemedText style={styles.retryButtonText}>{translations.tryAgain}</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.productsGrid}>
        {products.map(renderProductItem)}
      </View>
    );
  };

  const renderQuickAction = (icon: keyof typeof Ionicons.glyphMap, title: string, action: string) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.background }]}
      onPress={() => handleQuickAction(action)}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <ThemedText style={styles.quickActionText}>{title}</ThemedText>
    </TouchableOpacity>
  );

  const renderCartQuickAction = () => {
    const cartCount = getCartItemCount();
    return (
      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.background }]}
        onPress={() => handleQuickAction('View cart')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="cart-outline" size={24} color="white" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <ThemedText style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount.toString()}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.quickActionText}>{translations.myCart}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={28} color="#4CAF50" />
            <ThemedText style={styles.logoText}>AgriConnect</ThemedText>
          </View>
          <View style={styles.headerButtons}>
            {/* Language Toggle Button */}
            <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
              <View style={styles.languageIconContainer}>
                <Ionicons name="language-outline" size={20} color="#4CAF50" />
                <ThemedText style={styles.languageText}>{language === 'en' ? 'বাং' : 'EN'}</ThemedText>
              </View>
            </TouchableOpacity>
            
            {/* Logout Button */}
            <TouchableOpacity style={styles.cartButton} onPress={() => logout()}>
              <View style={styles.cartIconContainer}>
                <Ionicons name="log-out-outline" size={24} color="#4CAF50" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* Debug Info */}
        <View style={styles.debugSection}>
          <ThemedText style={styles.debugText}>
            User: {user ? `${user.name} (${user.role})` : 'Not logged in'}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            UID: {user?.uid || 'None'}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            Products in DB: {products.length}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            Loading: {loading ? 'Yes' : 'No'}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            Error: {error || 'None'}
          </ThemedText>
          {products.length === 0 && !loading && (
            <TouchableOpacity 
              style={styles.seedButton} 
              onPress={async () => {
                try {
                  setLoading(true);
                  setError(null);
                  console.log('Starting to add sample products...');
                  await productService.addSampleProducts();
                  console.log('Sample products added, fetching...');
                  const fetchedProducts = await productService.getAllProducts();
                  console.log('Fetched products:', fetchedProducts.length);
                  setProducts(fetchedProducts as Product[]);
                  Alert.alert('Success', `${fetchedProducts.length} sample products added to database!`);
                } catch (error: any) {
                  console.error('Error adding sample products:', error);
                  setError(error.message);
                  Alert.alert('Error', `Failed to add sample products: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <ThemedText style={styles.seedButtonText}>Add Sample Products</ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.seedButton, { backgroundColor: '#4CAF50', marginTop: 4 }]} 
            onPress={refreshProducts}
          >
            <ThemedText style={styles.seedButtonText}>Refresh Products</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Welcome Message */}
        {user && (
          <View style={styles.welcomeSection}>
            <ThemedText style={styles.welcomeText}>
              {translations.welcomeBack}, {user.name}! 👋
            </ThemedText>
            <View style={styles.roleBadge}>
              <Ionicons 
                name={user.role === 'farmer' ? 'leaf-outline' : 'cart-outline'} 
                size={16} 
                color="#4CAF50" 
              />
              <ThemedText style={styles.roleText}>
                {user.role === 'farmer' ? (language === 'en' ? 'Farmer' : 'কৃষক') : (language === 'en' ? 'Buyer' : 'ক্রেতা')}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={translations.searchPlaceholder}
            onSearch={(query) => {
              Alert.alert(translations.search, `${language === 'en' ? 'Searching for' : 'খুঁজছেন'}: ${query}`);
            }}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{translations.shopByCategory}</ThemedText>
          <View style={styles.categoriesContainer}>
            {mockCategories.map(renderCategoryItem)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{translations.quickActions}</ThemedText>
          <View style={styles.quickActionsContainer}>
            {renderQuickAction('add-circle-outline', translations.addProduct, 'Add new product')}
            {renderCartQuickAction()}
            {renderQuickAction('list-outline', translations.myOrders, 'View orders')}
            {renderQuickAction('chatbubbles-outline', translations.messages, 'View messages')}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{translations.featuredProducts}</ThemedText>
            <TouchableOpacity style={styles.viewAllButton}>
              <ThemedText style={styles.viewAllText}>{translations.viewAllProducts}</ThemedText>
            </TouchableOpacity>
          </View>
          {renderProductsContent()}
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{translations.recentOrders}</ThemedText>
          <View style={[styles.recentOrderCard, { backgroundColor: colors.background }]}>
            <View style={styles.recentOrderHeader}>
              <Ionicons name="time-outline" size={20} color={colors.icon} />
              <ThemedText style={styles.recentOrderTitle}>Order #12345</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                <ThemedText style={styles.statusText}>{translations.delivered}</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.recentOrderItems}>Fresh Tomatoes, Organic Rice</ThemedText>
            <ThemedText style={styles.recentOrderDate}>{language === 'en' ? 'Delivered on Dec 15, 2024' : '১৫ ডিসেম্বর, ২০২৪ এ পৌছে দেওয়া হয়েছে'}</ThemedText>
          </View>
        </View>

        {/* Why Choose AgriConnect Section */}
        <View style={styles.whyChooseSection}>
          <ThemedText style={styles.whyChooseTitle}>{translations.whyChooseAgriConnect}</ThemedText>
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="leaf-outline" size={32} color="#4CAF50" />
              </View>
              <ThemedText style={styles.featureTitle}>{translations.freshOrganic}</ThemedText>
              <ThemedText style={styles.featureDescription}>
                {translations.freshOrganicDesc}
              </ThemedText>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="people-outline" size={32} color="#2196F3" />
              </View>
              <ThemedText style={styles.featureTitle}>{translations.supportLocalFarmers}</ThemedText>
              <ThemedText style={styles.featureDescription}>
                {translations.supportLocalFarmersDesc}
              </ThemedText>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="car-outline" size={32} color="#FF9800" />
              </View>
              <ThemedText style={styles.featureTitle}>{translations.fastDelivery}</ThemedText>
              <ThemedText style={styles.featureDescription}>
                {translations.fastDeliveryDesc}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Logo and Tagline Section */}
          <View style={styles.footerLogoSection}>
            <View style={styles.footerLogo}>
              <Ionicons name="leaf" size={28} color="#4CAF50" />
              <ThemedText style={styles.footerLogoText}>AgriConnect</ThemedText>
            </View>
            <ThemedText style={styles.footerTagline}>
              Connecting farmers and buyers for a sustainable future in agriculture.
            </ThemedText>
          </View>

          {/* Links Section - Stacked vertically for mobile */}
          <View style={styles.footerLinksContainer}>
            {/* For Buyers */}
            <View style={styles.footerLinkSection}>
              <ThemedText style={styles.footerColumnTitle}>For Buyers</ThemedText>
              <View style={styles.footerLinksRow}>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Browse Products</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>How to Order</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.footerLinksRow}>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Delivery Info</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Customer Support</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* For Farmers */}
            <View style={styles.footerLinkSection}>
              <ThemedText style={styles.footerColumnTitle}>For Farmers</ThemedText>
              <View style={styles.footerLinksRow}>
                <TouchableOpacity 
                  style={styles.footerLinkItem}
                  onPress={() => router.push('/add-product')}
                >
                  <ThemedText style={styles.footerLink}>Sell Your Products</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.footerLinkItem}
                  onPress={() => router.push('/farmer-dashboard')}
                >
                  <ThemedText style={styles.footerLink}>Farmer Dashboard</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.footerLinksRow}>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Pricing Guide</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Success Stories</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Company */}
            <View style={styles.footerLinkSection}>
              <ThemedText style={styles.footerColumnTitle}>Company</ThemedText>
              <View style={styles.footerLinksRow}>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>About Us</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Contact</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.footerLinksRow}>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Privacy Policy</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLinkItem}>
                  <ThemedText style={styles.footerLink}>Terms of Service</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Copyright Section */}
          <View style={styles.footerDivider} />
          <View style={styles.footerCopyright}>
            <ThemedText style={styles.copyrightText}>© 2024 AgriConnect. All rights reserved.</ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 8,
  },
  cartButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  languageIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E91E63',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  searchSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (width - 60) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productsContainer: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  recentOrderCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  recentOrderItems: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  recentOrderDate: {
    fontSize: 12,
    opacity: 0.7,
    color: '#999',
  },
  whyChooseSection: {
    backgroundColor: '#F0F8F0',
    paddingVertical: 48,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  whyChooseTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 32,
  },
  featuresContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#1a1a1a',
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  footerLogoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  footerTagline: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  footerLinksContainer: {
    marginBottom: 24,
  },
  footerLinkSection: {
    marginBottom: 24,
  },
  footerColumnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footerLinkItem: {
    flex: 1,
    paddingHorizontal: 8,
  },
  footerLink: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingVertical: 8,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  footerCopyright: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
  debugSection: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  seedButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  seedButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
