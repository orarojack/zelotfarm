import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { CartItem, EcommerceProduct, LiveBid } from '../types';
import { useCustomerAuth } from './CustomerAuthContext';

interface TempCartItem {
  product_id?: string;
  bid_id?: string;
  quantity: number;
  unit_price: number;
  item_type: 'product' | 'bid';
  product?: EcommerceProduct;
  bid?: LiveBid;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  itemCount: number;
  totalAmount: number;
  addToCart: (productId?: string, bidId?: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  syncTempCartToAccount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const TEMP_CART_KEY = 'zealot_temp_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { customer } = useCustomerAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tempCartItems, setTempCartItems] = useState<TempCartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load temp cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TEMP_CART_KEY);
    if (saved) {
      try {
        const items = JSON.parse(saved);
        setTempCartItems(items);
      } catch (e) {
        console.error('Error loading temp cart:', e);
      }
    }
  }, []);

  // Save temp cart to localStorage whenever it changes (only when not logged in)
  useEffect(() => {
    if (!customer && tempCartItems.length > 0) {
      localStorage.setItem(TEMP_CART_KEY, JSON.stringify(tempCartItems));
      // Load details after saving
      loadTempCartWithDetails();
    } else if (customer) {
      localStorage.removeItem(TEMP_CART_KEY);
    }
  }, [tempCartItems, customer]);

  useEffect(() => {
    if (customer) {
      fetchCart();
      // Sync temp cart to account when user logs in
      if (tempCartItems.length > 0) {
        syncTempCartToAccount();
      }
    } else if (tempCartItems.length > 0) {
      // Load temp cart details when not logged in
      loadTempCartWithDetails();
    } else {
      setCartItems([]);
    }
  }, [customer]);

  const loadTempCartWithDetails = async () => {
    if (customer || tempCartItems.length === 0) {
      if (tempCartItems.length === 0) {
        setCartItems([]);
      }
      return;
    }

    setLoading(true);
    try {
      const itemsWithDetails = await Promise.all(
        tempCartItems.map(async (item) => {
          if (item.item_type === 'product' && item.product_id) {
            const { data: product } = await supabase
              .from('ecommerce_products')
              .select('*')
              .eq('id', item.product_id)
              .single();
            return { ...item, product: product as EcommerceProduct | null };
          } else if (item.item_type === 'bid' && item.bid_id) {
            const { data: bid } = await supabase
              .from('live_bids')
              .select('*')
              .eq('id', item.bid_id)
              .single();
            return { ...item, bid: bid as LiveBid | null };
          }
          return item;
        })
      );

      // Convert temp items to CartItem format for display
      setCartItems(
        itemsWithDetails.map((item, index) => ({
          id: `temp-${index}`,
          customer_id: '',
          product_id: item.product_id,
          bid_id: item.bid_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          item_type: item.item_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: item.product,
          bid: item.bid,
        })) as CartItem[]
      );
    } catch (error) {
      console.error('Error loading temp cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch product/bid details for each cart item
      const itemsWithDetails = await Promise.all(
        (data || []).map(async (item) => {
          if (item.item_type === 'product' && item.product_id) {
            const { data: product } = await supabase
              .from('ecommerce_products')
              .select('*')
              .eq('id', item.product_id)
              .single();
            return { ...item, product: product as EcommerceProduct | null };
          } else if (item.item_type === 'bid' && item.bid_id) {
            const { data: bid } = await supabase
              .from('live_bids')
              .select('*')
              .eq('id', item.bid_id)
              .single();
            return { ...item, bid: bid as LiveBid | null };
          }
          return item;
        })
      );

      setCartItems(itemsWithDetails as CartItem[]);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncTempCartToAccount = async () => {
    if (!customer || tempCartItems.length === 0) return;

    try {
      for (const tempItem of tempCartItems) {
        // Check if item already exists in account cart
        const { data: existing } = await supabase
          .from('cart_items')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('item_type', tempItem.item_type)
          .eq(tempItem.item_type === 'product' ? 'product_id' : 'bid_id', tempItem.product_id || tempItem.bid_id)
          .single();

        if (existing) {
          // Update quantity
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + tempItem.quantity })
            .eq('id', existing.id);
        } else {
          // Insert new item
          await supabase.from('cart_items').insert({
            customer_id: customer.id,
            product_id: tempItem.product_id || null,
            bid_id: tempItem.bid_id || null,
            quantity: tempItem.quantity,
            unit_price: tempItem.unit_price,
            item_type: tempItem.item_type,
          });
        }
      }

      // Clear temp cart
      setTempCartItems([]);
      localStorage.removeItem(TEMP_CART_KEY);
      await fetchCart();
    } catch (error) {
      console.error('Error syncing temp cart:', error);
    }
  };

  const addToCart = async (productId?: string, bidId?: string, quantity: number = 1) => {
    if (!productId && !bidId) {
      throw new Error('Either product or bid must be provided');
    }

    try {
      // Get current price
      let unitPrice = 0;
      let itemType: 'product' | 'bid' = 'product';

      if (productId) {
        const { data: product, error } = await supabase
          .from('ecommerce_products')
          .select('price')
          .eq('id', productId)
          .single();

        if (error) throw error;
        if (!product) throw new Error('Product not found');
        unitPrice = product.price;
        itemType = 'product';
      } else if (bidId) {
        const { data: bid, error } = await supabase
          .from('live_bids')
          .select('current_price')
          .eq('id', bidId)
          .single();

        if (error) throw error;
        if (!bid) throw new Error('Bid not found');
        unitPrice = bid.current_price;
        itemType = 'bid';
      }

      if (customer) {
        // User is logged in - add to database cart
        const existingItem = cartItems.find(
          (item) =>
            (item.product_id === productId && item.item_type === 'product') ||
            (item.bid_id === bidId && item.item_type === 'bid')
        );

        if (existingItem) {
          // Update quantity
          await updateQuantity(existingItem.id, existingItem.quantity + quantity);
        } else {
          // Insert new cart item
          const { error } = await supabase.from('cart_items').insert({
            customer_id: customer.id,
            product_id: productId || null,
            bid_id: bidId || null,
            quantity,
            unit_price: unitPrice,
            item_type: itemType,
          });

          if (error) throw error;
          await fetchCart();
        }
      } else {
        // User not logged in - add to temp cart
        const existingIndex = tempCartItems.findIndex(
          (item) =>
            (item.product_id === productId && item.item_type === 'product') ||
            (item.bid_id === bidId && item.item_type === 'bid')
        );

        if (existingIndex >= 0) {
          // Update quantity in temp cart
          const updated = [...tempCartItems];
          updated[existingIndex].quantity += quantity;
          setTempCartItems(updated);
        } else {
          // Add new item to temp cart
          const newItem: TempCartItem = {
            product_id: productId,
            bid_id: bidId,
            quantity,
            unit_price: unitPrice,
            item_type: itemType,
          };
          setTempCartItems([...tempCartItems, newItem]);
        }
        // Reload temp cart with details
        await loadTempCartWithDetails();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (cartItemId.startsWith('temp-')) {
      // Remove from temp cart
      const index = parseInt(cartItemId.replace('temp-', ''));
      const updated = tempCartItems.filter((_, i) => i !== index);
      setTempCartItems(updated);
      await loadTempCartWithDetails();
      return;
    }

    if (!customer) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    if (cartItemId.startsWith('temp-')) {
      // Update temp cart
      const index = parseInt(cartItemId.replace('temp-', ''));
      const updated = [...tempCartItems];
      updated[index].quantity = quantity;
      setTempCartItems(updated);
      await loadTempCartWithDetails();
      return;
    }

    if (!customer) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (customer) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('customer_id', customer.id);

        if (error) throw error;
        await fetchCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
      }
    } else {
      setTempCartItems([]);
      setCartItems([]);
      localStorage.removeItem(TEMP_CART_KEY);
    }
  };

  // Calculate totals from both cart sources
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        itemCount,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: customer ? fetchCart : loadTempCartWithDetails,
        syncTempCartToAccount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

