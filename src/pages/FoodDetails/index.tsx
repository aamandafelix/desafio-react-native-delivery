import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
  category: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get<Food>(`foods/${routeParams.id}`);

      const formattedFood = {
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      };

      setFood(formattedFood);

      const formattedExtras = formattedFood.extras.map(extra => ({
        ...extra,
        quantity: 0,
      }));

      setExtras(formattedExtras);
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function loadIsFavorite(): Promise<void> {
      const response = await api.get(`favorites/${routeParams.id}`);

      if (response.data) {
        setIsFavorite(true);
      }
    }

    loadIsFavorite();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const updatedExtras = extras.map(extra => {
      if (extra.id === id) {
        return {
          ...extra,
          quantity: extra.quantity + 1,
        };
      }
      return extra;
    });

    setExtras(updatedExtras);
  }

  function handleDecrementExtra(id: number): void {
    const existingExtra = extras.find(extra => extra.id === id);

    if (!existingExtra) {
      return;
    }

    if (existingExtra.quantity === 0) {
      return;
    }

    const updatedExtras = extras.map(extra => {
      if (extra.id === id) {
        return {
          ...extra,
          quantity: extra.quantity - 1,
        };
      }
      return extra;
    });

    setExtras(updatedExtras);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(state => state + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity === 1) {
      return;
    }

    setFoodQuantity(quantity => quantity - 1);
  }

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      api.delete(`favorites/${food.id}`);
    } else {
      api.post('favorites', food);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extrasTotal = extras.reduce(
      (accumulator, extra) => accumulator + extra.quantity * extra.value,
      0,
    );

    return (food.price + extrasTotal) * foodQuantity;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const order = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: cartTotal,
      category: routeParams.category,
      thumbnail_url: food.image_url,
      extras,
    };

    await api.post('orders', order);

    navigation.navigate('/Home');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
