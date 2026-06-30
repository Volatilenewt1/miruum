import type { PresetGroup } from './types';

export const PRESETS: PresetGroup[] = [
  { room: 'Bedroom', cats: [
    { cat: 'Bed', items: [
      { name: 'Twin Bed',       w: 38, h: 75 },
      { name: 'Twin XL Bed',    w: 38, h: 80 },
      { name: 'Full Bed',       w: 54, h: 75 },
      { name: 'Queen Bed',      w: 60, h: 80 },
      { name: 'King Bed',       w: 76, h: 80 },
      { name: 'Cal King Bed',   w: 72, h: 84 },
      { name: 'Split King Bed', w: 76, h: 80 },
      { name: 'RV Short Queen', w: 60, h: 74 },
    ]},
    { cat: 'Bed Frame / Platform', items: [
      { name: 'Twin Frame',     w: 40, h: 77 },
      { name: 'Twin XL Frame',  w: 40, h: 82 },
      { name: 'Full Frame',     w: 56, h: 77 },
      { name: 'Queen Frame',    w: 62, h: 82 },
      { name: 'King Frame',     w: 78, h: 82 },
      { name: 'Cal King Frame', w: 74, h: 86 },
    ]},
    { cat: 'Nightstand', items: [
      { name: 'Nightstand Small',    w: 18, h: 16 },
      { name: 'Nightstand Standard', w: 22, h: 18 },
      { name: 'Nightstand Large',    w: 26, h: 20 },
      { name: 'Floating Nightstand', w: 24, h: 14 },
    ]},
    { cat: 'Dresser', items: [
      { name: 'Dresser 3-Drawer',       w: 36, h: 18 },
      { name: 'Dresser 4-Drawer',       w: 36, h: 18 },
      { name: 'Dresser 5-Drawer',       w: 40, h: 18 },
      { name: 'Dresser 6-Drawer',       w: 60, h: 18 },
      { name: 'Dresser 7-Drawer',       w: 66, h: 18 },
      { name: 'Chest of Drawers 4-Drw', w: 32, h: 18 },
      { name: 'Chest of Drawers 6-Drw', w: 32, h: 18 },
    ]},
    { cat: 'Wardrobe / Armoire', items: [
      { name: 'Wardrobe Small', w: 36, h: 22 },
      { name: 'Wardrobe Large', w: 60, h: 24 },
      { name: 'Armoire',        w: 48, h: 24 },
    ]},
    { cat: 'End-of-Bed Bench', items: [
      { name: 'Bench Small',    w: 36, h: 14 },
      { name: 'Bench Standard', w: 48, h: 16 },
      { name: 'Bench Large',    w: 60, h: 18 },
    ]},
    { cat: 'Vanity Table', items: [
      { name: 'Vanity Small',    w: 30, h: 18 },
      { name: 'Vanity Standard', w: 40, h: 20 },
      { name: 'Vanity Large',    w: 48, h: 20 },
    ]},
    { cat: 'Accent Chair', items: [
      { name: 'Accent Chair', w: 30, h: 32 },
    ]},
  ]},

  { room: 'Living Room', cats: [
    { cat: 'Sofa', items: [
      { name: 'Loveseat',      w: 60, h: 34 },
      { name: 'Small Sofa',    w: 72, h: 34 },
      { name: 'Standard Sofa', w: 84, h: 34 },
      { name: 'Large Sofa',    w: 96, h: 34 },
      { name: 'Sleeper Sofa',  w: 84, h: 38 },
      { name: 'Chaise Lounge', w: 65, h: 32 },
    ]},
    { cat: 'Sectional', items: [
      { name: 'Sectional L-Shape', w: 110, h: 110, shape: 'lshape' },
      { name: 'Sectional U-Shape', w: 120, h: 96 },
      { name: 'Sectional Curved',  w: 96,  h: 48 },
    ]},
    { cat: 'Accent Chair', items: [
      { name: 'Armchair',      w: 32, h: 32 },
      { name: 'Barrel Chair',  w: 30, h: 30 },
      { name: 'Wing Chair',    w: 32, h: 34 },
      { name: 'Swivel Chair',  w: 30, h: 30 },
      { name: 'Papasan Chair', w: 42, h: 42, shape: 'round' },
    ]},
    { cat: 'Recliner', items: [
      { name: 'Recliner Standard', w: 34, h: 32 },
      { name: 'Recliner Large',    w: 38, h: 34 },
      { name: 'Power Recliner',    w: 34, h: 34 },
    ]},
    { cat: 'Coffee Table', items: [
      { name: 'Coffee Table Round Sm', w: 24, h: 24, shape: 'round' },
      { name: 'Coffee Table Round Md', w: 36, h: 36, shape: 'round' },
      { name: 'Coffee Table Round Lg', w: 48, h: 48, shape: 'round' },
      { name: 'Coffee Table Rect Sm',  w: 36, h: 20 },
      { name: 'Coffee Table Rect Md',  w: 48, h: 24 },
      { name: 'Coffee Table Rect Lg',  w: 60, h: 28 },
      { name: 'Coffee Table Oval',     w: 48, h: 28, shape: 'oval' },
    ]},
    { cat: 'End / Side Table', items: [
      { name: 'Side Table Small', w: 18, h: 18 },
      { name: 'Side Table Large', w: 22, h: 22 },
      { name: 'Side Table Round', w: 22, h: 22, shape: 'round' },
    ]},
    { cat: 'TV Stand / Media Console', items: [
      { name: 'TV Stand 48"',        w: 48, h: 18 },
      { name: 'TV Stand 60"',        w: 60, h: 18 },
      { name: 'TV Stand 72"',        w: 72, h: 18 },
      { name: 'Entertainment Center', w: 84, h: 20 },
      { name: 'Fireplace Console',   w: 60, h: 18 },
    ]},
    { cat: 'Bookshelf', items: [
      { name: 'Bookshelf Small',  w: 30, h: 12 },
      { name: 'Bookshelf Medium', w: 36, h: 12 },
      { name: 'Bookshelf Large',  w: 48, h: 12 },
      { name: 'Bookshelf Wide',   w: 60, h: 14 },
    ]},
    { cat: 'Ottoman', items: [
      { name: 'Ottoman Round',     w: 30, h: 30, shape: 'round' },
      { name: 'Ottoman Square',    w: 24, h: 24 },
      { name: 'Ottoman Rectangle', w: 48, h: 24 },
      { name: 'Storage Ottoman',   w: 36, h: 24 },
    ]},
  ]},

  { room: 'Dining Room', cats: [
    { cat: 'Dining Table', items: [
      { name: 'Round Table 2-person',  w: 30, h: 30,  shape: 'round' },
      { name: 'Round Table 4-person',  w: 42, h: 42,  shape: 'round' },
      { name: 'Round Table 6-person',  w: 54, h: 54,  shape: 'round' },
      { name: 'Rect Table 4-person',   w: 36, h: 30 },
      { name: 'Rect Table 6-person',   w: 60, h: 36 },
      { name: 'Rect Table 8-person',   w: 72, h: 36 },
      { name: 'Rect Table 10-person',  w: 84, h: 42 },
      { name: 'Rect Table 12-person',  w: 96, h: 42 },
      { name: 'Oval Table 6-person',   w: 60, h: 36, shape: 'oval' },
      { name: 'Oval Table 8-person',   w: 72, h: 42, shape: 'oval' },
    ]},
    { cat: 'Dining Chair', items: [
      { name: 'Dining Chair',    w: 18, h: 18 },
      { name: 'Dining Armchair', w: 24, h: 22 },
    ]},
    { cat: 'Dining Bench', items: [
      { name: 'Bench Small',    w: 36, h: 14 },
      { name: 'Bench Standard', w: 48, h: 14 },
      { name: 'Bench Large',    w: 60, h: 14 },
    ]},
    { cat: 'Buffet / Sideboard', items: [
      { name: 'Buffet Small',    w: 48, h: 16 },
      { name: 'Buffet Standard', w: 60, h: 18 },
      { name: 'Buffet Large',    w: 72, h: 20 },
    ]},
    { cat: 'China Cabinet', items: [
      { name: 'China Cabinet Standard', w: 42, h: 18 },
      { name: 'China Cabinet Large',    w: 60, h: 18 },
    ]},
    { cat: 'Bar Cart', items: [
      { name: 'Bar Cart', w: 30, h: 16 },
    ]},
  ]},

  { room: 'Home Office', cats: [
    { cat: 'Desk', items: [
      { name: 'Desk Small',    w: 48, h: 24 },
      { name: 'Desk Standard', w: 60, h: 30 },
      { name: 'Desk Wide',     w: 72, h: 30 },
      { name: 'Standing Desk', w: 48, h: 28 },
      { name: 'L-Shape Desk',  w: 60, h: 60, shape: 'lshape' },
      { name: 'Corner Desk',   w: 54, h: 54, shape: 'lshape' },
    ]},
    { cat: 'Office Chair', items: [
      { name: 'Task Chair',      w: 26, h: 26 },
      { name: 'Executive Chair', w: 28, h: 28 },
      { name: 'Gaming Chair',    w: 24, h: 26 },
    ]},
    { cat: 'Bookcase', items: [
      { name: 'Bookcase Small',      w: 24, h: 12 },
      { name: 'Bookcase Standard',   w: 36, h: 12 },
      { name: 'Bookcase Large',      w: 48, h: 12 },
      { name: 'Bookcase Extra Wide', w: 60, h: 14 },
    ]},
    { cat: 'Filing Cabinet', items: [
      { name: 'File Cabinet Vertical 2-Drw', w: 15, h: 26 },
      { name: 'File Cabinet Vertical 4-Drw', w: 15, h: 26 },
      { name: 'File Cabinet Lateral 2-Drw',  w: 36, h: 20 },
      { name: 'File Cabinet Lateral 4-Drw',  w: 36, h: 20 },
    ]},
    { cat: 'Printer / Equipment', items: [
      { name: 'Printer',       w: 18, h: 16 },
      { name: 'Monitor',       w: 24, h: 10 },
      { name: 'Desktop Tower', w: 8,  h: 18 },
      { name: 'Space Heater',  w: 14, h: 14 },
    ]},
  ]},

  { room: 'Kitchen', cats: [
    { cat: 'Appliances', items: [
      { name: 'Refrigerator 30"', w: 30, h: 32 },
      { name: 'Refrigerator 36"', w: 36, h: 34 },
      { name: 'Dishwasher',       w: 24, h: 25 },
      { name: 'Range 30"',        w: 30, h: 28 },
      { name: 'Range 36"',        w: 36, h: 28 },
      { name: 'Microwave',        w: 24, h: 15 },
      { name: 'Wall Oven',        w: 24, h: 24 },
    ]},
    { cat: 'Kitchen Island', items: [
      { name: 'Island Small',    w: 24, h: 36 },
      { name: 'Island Standard', w: 30, h: 60 },
      { name: 'Island Large',    w: 36, h: 72 },
    ]},
    { cat: 'Pantry Cabinet', items: [
      { name: 'Pantry Standard', w: 24, h: 24 },
      { name: 'Pantry Large',    w: 36, h: 24 },
    ]},
    { cat: 'Kitchen Table', items: [
      { name: 'Kitchen Table Round', w: 30, h: 30, shape: 'round' },
      { name: 'Kitchen Table Rect',  w: 30, h: 48 },
    ]},
  ]},

  { room: 'Bathroom', cats: [
    { cat: 'Fixtures', items: [
      { name: 'Toilet Standard',    w: 16, h: 28 },
      { name: 'Toilet Elongated',   w: 16, h: 31 },
      { name: 'Toilet Compact',     w: 14, h: 26 },
      { name: 'Single Sink',        w: 21, h: 16 },
      { name: 'Double Sink',        w: 48, h: 20 },
      { name: 'Pedestal Sink',      w: 24, h: 20, shape: 'round' },
      { name: 'Bathtub Standard',   w: 30, h: 60 },
      { name: 'Soaking Tub',        w: 32, h: 67, shape: 'oval' },
      { name: 'Corner Tub',         w: 54, h: 54, shape: 'tri' },
      { name: 'Walk-in Shower 36"', w: 36, h: 36 },
      { name: 'Walk-in Shower 48"', w: 48, h: 48 },
    ]},
    { cat: 'Storage', items: [
      { name: 'Vanity Small',    w: 24, h: 20 },
      { name: 'Vanity Standard', w: 36, h: 20 },
      { name: 'Vanity Large',    w: 48, h: 20 },
      { name: 'Medicine Cabinet', w: 20, h: 6 },
      { name: 'Linen Tower',     w: 18, h: 18 },
      { name: 'Hamper',          w: 14, h: 16 },
    ]},
  ]},

  { room: 'Entryway', cats: [
    { cat: 'Entry Table', items: [
      { name: 'Entry Table Small',    w: 30, h: 12 },
      { name: 'Entry Table Standard', w: 48, h: 14 },
    ]},
    { cat: 'Storage Bench', items: [
      { name: 'Storage Bench Small', w: 36, h: 16 },
      { name: 'Storage Bench Large', w: 48, h: 16 },
    ]},
    { cat: 'Shoe Cabinet', items: [
      { name: 'Shoe Cabinet', w: 36, h: 12 },
    ]},
    { cat: 'Coat Rack', items: [
      { name: 'Coat Rack', w: 18, h: 18 },
    ]},
    { cat: 'Umbrella Stand', items: [
      { name: 'Umbrella Stand', w: 12, h: 12 },
    ]},
  ]},

  { room: 'Outdoor', cats: [
    { cat: 'Seating', items: [
      { name: 'Adirondack Chair',  w: 30, h: 37 },
      { name: 'Outdoor Loveseat', w: 52, h: 28 },
      { name: 'Outdoor Sofa',     w: 72, h: 30 },
      { name: 'Chaise Lounge',    w: 25, h: 72 },
      { name: 'Patio Chair',      w: 28, h: 28 },
      { name: 'Garden Bench',     w: 48, h: 18 },
    ]},
    { cat: 'Tables', items: [
      { name: 'Side / Drink Table',     w: 18, h: 18, shape: 'round' },
      { name: 'Outdoor Round Table Sm', w: 30, h: 30, shape: 'round' },
      { name: 'Outdoor Round Table Md', w: 48, h: 48, shape: 'round' },
      { name: 'Outdoor Rect Table',     w: 72, h: 38 },
    ]},
    { cat: 'Fire Feature', items: [
      { name: 'Fire Pit',  w: 36, h: 36, shape: 'round' },
      { name: 'Chiminea',  w: 18, h: 18 },
    ]},
    { cat: 'Accents', items: [
      { name: 'Outdoor Ottoman', w: 24, h: 24 },
      { name: 'Planter Small',   w: 18, h: 18, shape: 'round' },
      { name: 'Planter Large',   w: 30, h: 30, shape: 'round' },
      { name: 'Umbrella Base',   w: 18, h: 18, shape: 'round' },
    ]},
  ]},

  { room: 'Stairs', cats: [
    { cat: 'Stairs', items: [
      { name: 'Stairs', w: 72, h: 42 },
    ]},
  ]},

  { room: 'Appliances & Electronics', cats: [
    { cat: 'Laundry & Refrigeration', items: [
      { name: 'Washer',             w: 27, h: 28 },
      { name: 'Dryer',              w: 27, h: 28 },
      { name: 'Washer-Dryer Combo', w: 27, h: 28 },
      { name: 'Chest Freezer',      w: 30, h: 48 },
      { name: 'Upright Freezer',    w: 28, h: 24 },
    ]},
    { cat: 'Entertainment', items: [
      { name: 'TV 55"',    w: 49, h: 14 },
      { name: 'TV 65"',    w: 58, h: 14 },
      { name: 'TV 75"',    w: 66, h: 14 },
      { name: 'TV 85"',    w: 75, h: 14 },
      { name: 'Sound Bar', w: 40, h: 4  },
    ]},
  ]},
];
