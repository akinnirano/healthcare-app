provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "healthcare-rg"
  location = "East US"
}
