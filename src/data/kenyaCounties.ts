// Kenya Counties and Constituencies Data
export interface County {
  name: string;
  constituencies: string[];
}

export const kenyaCounties: County[] = [
  {
    name: 'Baringo',
    constituencies: ['Baringo North', 'Baringo Central', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Tiaty']
  },
  {
    name: 'Bomet',
    constituencies: ['Bomet Central', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik']
  },
  {
    name: 'Bungoma',
    constituencies: ['Bumula', 'Kabuchai', 'Kanduyi', 'Kimilili', 'Mt. Elgon', 'Sirisia', 'Tongaren', 'Webuye East', 'Webuye West']
  },
  {
    name: 'Busia',
    constituencies: ['Budalangi', 'Butula', 'Funyula', 'Matayos', 'Nambale', 'Teso North', 'Teso South']
  },
  {
    name: 'Elgeyo-Marakwet',
    constituencies: ['Keiyo North', 'Keiyo South', 'Marakwet East', 'Marakwet West']
  },
  {
    name: 'Embu',
    constituencies: ['Embu East', 'Embu North', 'Embu West', 'Manyatta', 'Mbeere North', 'Mbeere South', 'Runyenjes']
  },
  {
    name: 'Garissa',
    constituencies: ['Dadaab', 'Fafi', 'Garissa Township', 'Ijara', 'Lagdera']
  },
  {
    name: 'Homa Bay',
    constituencies: ['Homa Bay Town', 'Kabondo Kasipul', 'Karachuonyo', 'Kasipul', 'Ndhiwa', 'Rangwe', 'Suba North', 'Suba South']
  },
  {
    name: 'Isiolo',
    constituencies: ['Isiolo North', 'Isiolo South']
  },
  {
    name: 'Kajiado',
    constituencies: ['Kajiado Central', 'Kajiado East', 'Kajiado North', 'Kajiado South', 'Kajiado West']
  },
  {
    name: 'Kakamega',
    constituencies: ['Butere', 'Ikolomani', 'Khwisero', 'Likuyani', 'Lugari', 'Lurambi', 'Malava', 'Matungu', 'Mumias East', 'Mumias West', 'Navakholo', 'Shinyalu']
  },
  {
    name: 'Kericho',
    constituencies: ['Ainamoi', 'Belgut', 'Bureti', 'Kipkelion East', 'Kipkelion West', 'Soin Sigowet']
  },
  {
    name: 'Kiambu',
    constituencies: ['Gatundu North', 'Gatundu South', 'Githunguri', 'Juja', 'Kabete', 'Kiambaa', 'Kiambu', 'Kikuyu', 'Lari', 'Limuru', 'Ruiru', 'Thika Town']
  },
  {
    name: 'Kilifi',
    constituencies: ['Ganze', 'Kaloleni', 'Kilifi North', 'Kilifi South', 'Magarini', 'Malindi', 'Rabai']
  },
  {
    name: 'Kirinyaga',
    constituencies: ['Gichugu', 'Mwea', 'Ndia', 'Kirinyaga Central']
  },
  {
    name: 'Kisii',
    constituencies: ['Bobasi', 'Bomachoge Borabu', 'Bomachoge Chache', 'Bonchari', 'Kitutu Chache North', 'Kitutu Chache South', 'Nyaribari Chache', 'Nyaribari Masaba', 'South Mugirango']
  },
  {
    name: 'Kisumu',
    constituencies: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Muhoroni', 'Nyakach', 'Nyando', 'Seme']
  },
  {
    name: 'Kitui',
    constituencies: ['Kitui Central', 'Kitui East', 'Kitui Rural', 'Kitui South', 'Kitui West', 'Mwingi Central', 'Mwingi North', 'Mwingi West']
  },
  {
    name: 'Kwale',
    constituencies: ['Kinango', 'Lunga Lunga', 'Matuga', 'Msambweni']
  },
  {
    name: 'Laikipia',
    constituencies: ['Laikipia East', 'Laikipia North', 'Laikipia West']
  },
  {
    name: 'Lamu',
    constituencies: ['Lamu East', 'Lamu West']
  },
  {
    name: 'Machakos',
    constituencies: ['Kathiani', 'Machakos Town', 'Masinga', 'Matungulu', 'Mavoko', 'Mwala', 'Yatta']
  },
  {
    name: 'Makueni',
    constituencies: ['Kaiti', 'Kibwezi East', 'Kibwezi West', 'Kilome', 'Makueni', 'Mbooni']
  },
  {
    name: 'Mandera',
    constituencies: ['Banissa', 'Lafey', 'Mandera East', 'Mandera North', 'Mandera South', 'Mandera West']
  },
  {
    name: 'Marsabit',
    constituencies: ['Laisamis', 'Moyale', 'North Horr', 'Saku']
  },
  {
    name: 'Meru',
    constituencies: ['Buuri', 'Central Imenti', 'Igembe Central', 'Igembe North', 'Igembe South', 'North Imenti', 'South Imenti', 'Tigania East', 'Tigania West']
  },
  {
    name: 'Migori',
    constituencies: ['Awendo', 'Kuria East', 'Kuria West', 'Nyatike', 'Rongo', 'Suna East', 'Suna West', 'Uriri']
  },
  {
    name: 'Mombasa',
    constituencies: ['Changamwe', 'Jomvu', 'Kisauni', 'Likoni', 'Mvita', 'Nyali']
  },
  {
    name: 'Murang\'a',
    constituencies: ['Gatanga', 'Kandara', 'Kangema', 'Kigumo', 'Kiharu', 'Mathioya', 'Murang\'a South']
  },
  {
    name: 'Nairobi',
    constituencies: ['Dagoretti North', 'Dagoretti South', 'Embakasi Central', 'Embakasi East', 'Embakasi North', 'Embakasi South', 'Embakasi West', 'Kamukunji', 'Kasarani', 'Kibra', 'Lang\'ata', 'Makadara', 'Mathare', 'Roysambu', 'Ruaraka', 'Starehe', 'Westlands']
  },
  {
    name: 'Nakuru',
    constituencies: ['Bahati', 'Gilgil', 'Kuresoi North', 'Kuresoi South', 'Molo', 'Naivasha', 'Nakuru Town East', 'Nakuru Town West', 'Njoro', 'Rongai', 'Subukia']
  },
  {
    name: 'Nandi',
    constituencies: ['Aldai', 'Chesumei', 'Emgwen', 'Mosop', 'Nandi Hills', 'Tinderet']
  },
  {
    name: 'Narok',
    constituencies: ['Emurua Dikirr', 'Kilgoris', 'Narok East', 'Narok North', 'Narok South', 'Narok West']
  },
  {
    name: 'Nyamira',
    constituencies: ['Borabu', 'Kitutu Masaba', 'North Mugirango', 'West Mugirango']
  },
  {
    name: 'Nyandarua',
    constituencies: ['Kinangop', 'Kipipiri', 'Ndaragwa', 'Ol Jorok', 'Ol Kalou']
  },
  {
    name: 'Nyeri',
    constituencies: ['Kieni', 'Mathira', 'Mukurweini', 'Nyeri Town', 'Othaya', 'Tetu']
  },
  {
    name: 'Samburu',
    constituencies: ['Samburu East', 'Samburu North', 'Samburu West']
  },
  {
    name: 'Siaya',
    constituencies: ['Alego Usonga', 'Bondo', 'Gem', 'Rarieda', 'Ugenya', 'Ugunja']
  },
  {
    name: 'Taita Taveta',
    constituencies: ['Mwatate', 'Taveta', 'Voi', 'Wundanyi']
  },
  {
    name: 'Tana River',
    constituencies: ['Bura', 'Galole', 'Garsen']
  },
  {
    name: 'Tharaka-Nithi',
    constituencies: ['Chuka/Igambang\'ombe', 'Maara', 'Tharaka']
  },
  {
    name: 'Trans Nzoia',
    constituencies: ['Cherangany', 'Endebess', 'Kwanza', 'Saboti', 'Kiminini']
  },
  {
    name: 'Turkana',
    constituencies: ['Loima', 'Turkana Central', 'Turkana East', 'Turkana North', 'Turkana South', 'Turkana West']
  },
  {
    name: 'Uasin Gishu',
    constituencies: ['Ainabkoi', 'Kapseret', 'Kesses', 'Moiben', 'Soy', 'Turbo']
  },
  {
    name: 'Vihiga',
    constituencies: ['Emuhaya', 'Hamisi', 'Luanda', 'Sabatia', 'Vihiga']
  },
  {
    name: 'Wajir',
    constituencies: ['Eldas', 'Tarbaj', 'Wajir East', 'Wajir North', 'Wajir South', 'Wajir West']
  },
  {
    name: 'West Pokot',
    constituencies: ['Kapenguria', 'Kacheliba', 'Pokot South', 'Sigor']
  }
];

// Helper function to get constituencies by county name
export const getConstituenciesByCounty = (countyName: string): string[] => {
  const county = kenyaCounties.find(c => c.name === countyName);
  return county ? county.constituencies : [];
};

// Helper function to get all county names
export const getCountyNames = (): string[] => {
  return kenyaCounties.map(c => c.name).sort();
};

