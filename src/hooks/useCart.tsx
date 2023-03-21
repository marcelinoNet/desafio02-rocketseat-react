import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      const addCart = [...cart];
      
      const productExistInCart = addCart.find((product) => product.id === productId);
     
      const productAmount = productExistInCart ? productExistInCart.amount : 0;
      
      const requestProductAmount = productAmount + 1;

      const stock = await api.get(`stock/${productId}`)
      const stockAmount = stock.data.amount;

      if(requestProductAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExistInCart){
        productExistInCart.amount = requestProductAmount;
      } else {
        const productResponse = await api.get(`products/${productId}`);
        const newProduct = {
          ...productResponse.data,
          amount: 1
        }
        addCart.push(newProduct);
      }

      setCart(addCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(addCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeCart = [...cart];
      const productIndexToRemove = removeCart.findIndex(product => product.id === productId);
      if(productIndexToRemove >= 0){
        removeCart.splice(productIndexToRemove,1);
        setCart(removeCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeCart));
      } else {
        throw Error()
      }
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0) return;
    
      const requestProductAmount = amount;
      const stock = await api.get(`stock/${productId}`)
      const stockAmount = stock.data.amount;

      if(requestProductAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

       
      const updateCart = [...cart];
      const productExistInCart = updateCart.find((product) => product.id === productId);

      if(productExistInCart){
        productExistInCart.amount = requestProductAmount;
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
