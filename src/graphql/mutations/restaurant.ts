// Restaurant Mutations
export const CREATE_APPLICATION = `
  mutation CreateApplication($input: RestaurantOnboardingApplicationInput!) {
    createRestaurantOnboardingApplication(input: $input) {
      _id
      resubmissionCount
      applicationStatus
      restaurantName
      createdAt
    }
  }
`;

export const CREATE_RESTAURANT = `
  mutation CreateRestaurant($input: CreateRestaurantInput!) {
    createRestaurant(input: $input) {
      id
      name
      status
    }
  }
`;

export const UPDATE_RESTAURANT = `
  mutation UpdateRestaurant($id: ID!, $input: UpdateRestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      id
      name
      status
    }
  }
`;

export const RESUBMIT_APPLICATION = `
  mutation ResubmitRestaurantOnboardingApplication($applicationId: ID!, $input: RestaurantOnboardingApplicationInput!) {
    resubmitRestaurantOnboardingApplication(applicationId: $applicationId, input: $input) {
      _id
      resubmissionCount
      applicationStatus
      restaurantName
      createdAt
    }
  }
`;