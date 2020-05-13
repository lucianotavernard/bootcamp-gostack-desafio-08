import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketingplace:products',
      );

      if (storedProducts) {
        const parsedStoredProducts = JSON.parse(storedProducts) as Product[];

        setProducts(parsedStoredProducts);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        storedProduct => storedProduct.id === product.id,
      );

      const currentQuantity = productExists ? productExists.quantity : 0;
      const quantity = currentQuantity + 1;

      if (productExists) {
        const updatedProducts = products.map(storedProduct =>
          storedProduct.id === product.id
            ? { ...storedProduct, quantity }
            : storedProduct,
        );

        AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(updatedProducts),
        );

        setProducts(updatedProducts);

        return;
      }

      const newProduct = {
        ...product,
        quantity,
      };

      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([...products, newProduct]),
      );

      setProducts([...products, newProduct]);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );

      setProducts(updatedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findedProduct = products.find(product => product.id === id);

      if (findedProduct && findedProduct.quantity === 1) {
        const filteredProducts = products.filter(product => product.id !== id);

        AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(filteredProducts),
        );

        setProducts(filteredProducts);

        return;
      }

      const updatedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );

      setProducts(updatedProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
