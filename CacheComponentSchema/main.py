from web3 import Web3
import json

w3 = Web3(Web3.WebsocketProvider("wss://go.getblock.io/b32c8ea4f9a94c41837c68df4881d52f"))
assert(w3.is_connected())
print("Connected") 

#get World Contract 
with open('World.json', 'r') as file:
    world_abi = json.load(file)["abi"] 
world_address = "0x40aEaA59D096ff56Cb25cDD7f8198108fb67A519"
World = w3.eth.contract(
    address=world_address,
    abi=world_abi
)

#get components
with open('ComponentListFromState.json', 'r') as file:
  components = json.load(file)["components"]

componentId_address_pairs = []
for componentId in components[1:]: #component[0] -> 0x0 is never registered
  componentId_as_decimal = int(componentId, 16)
  component_address = World.functions.getComponent(componentId_as_decimal).call() 
  componentId_address_pairs.append((componentId, component_address)) 


with open('Component.json', 'r') as file:
  component_abi = json.load(file)["abi"]

componentId_schema_map = {}
for componentId, address in componentId_address_pairs:
  Component = w3.eth.contract(
    address=address,
    abi=component_abi
  )
  component_schema = Component.functions.getSchema().call()

  componentId_schema_map[componentId] = { 
    "keys": component_schema[0],
    "values": component_schema[1] 
  }

file_name = "ComponentSchemas.json"
with open(file_name, 'w') as file:
    json.dump(componentId_schema_map, file, indent=4)
    
print(f"{file_name} created")
