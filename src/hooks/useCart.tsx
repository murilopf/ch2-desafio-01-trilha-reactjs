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
      const products = localStorage.getItem('@RocketShoes:products');

      if (products && productId) {
        const newCartProduct = JSON.parse(products).find((product: { id: number; }) => product.id === productId)
        const productExists = cart.find((product) => product.id === newCartProduct.id)

        if (productExists) {
          updateProductAmount({ productId, amount: 1 })
        } else {
          const cartValue: Product[] = [
            ...cart,
            {
              ...newCartProduct,
              amount: 1,
            }
          ]
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartValue))
          setCart(cartValue)
        }
      } else {
        throw new Error("error");
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeIndex = cart.findIndex((product) => product.id === productId)

      if (removeIndex !== -1) {
        const newArray = [...cart];
        newArray.splice(removeIndex, 1);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray))
        setCart(newArray)
      } else {
        throw new Error("error");
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
      const updateIndex = cart.findIndex((product) => product.id === productId)

      if (updateIndex !== -1) {
        api.get(`/stock/${productId}`)
          .then((res) => {
            if (cart[updateIndex].amount === res.data.amount && amount !== -1) {
              toast.error('Quantidade solicitada fora de estoque')
              return;
            }

            cart[updateIndex].amount += amount;

            localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
            setCart([...cart])
          })

      } else {
        throw new Error("error");
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
