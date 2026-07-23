export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",

  name: "Jay Collections for Wedding",

  url: "https://jaycollection.id",

  description:
    "Platform undangan digital pernikahan terbaik di Indonesia.",

  inLanguage: "id-ID",

  publisher: {
    "@type": "Organization",
    name: "Jay Collections for Wedding",
    url: "https://jaycollection.id",
  },

  potentialAction: {
    "@type": "SearchAction",

    target:
      "https://jaycollection.id/referensi-design?q={search_term_string}",

    "query-input": "required name=search_term_string",
  },
};

export const organizationSchema = {

  "@context":"https://schema.org",

  "@type":"Organization",

  name:"Jay Collections for Wedding",

  url:"https://jaycollection.id",

  logo:"https://jaycollection.id/logo.png",

  sameAs:[
      "https://www.instagram.com/jaycollection"
  ]

}

export const localBusinessSchema = {

  "@context":"https://schema.org",

  "@type":"LocalBusiness",

  name:"Jay Collections for Wedding",

  image:"https://jaycollection.id/logo.png",

  telephone:"+62-000-0000-0000",

  address:{
      "@type":"PostalAddress",
      addressCountry:"ID",
      addressRegion:"Jawa Barat"
  },

  openingHours:"Mo-Su 00:00-24:00",

  url:"https://jaycollection.id"

}

export function designCategorySchema(category: {

    name:string

    description:string

    slug:string

    thumbnail_url?:string

    details: JSON[]

}){

return{

  "@context":"https://schema.org",

  "@type":"CollectionPage",

  name:`Desain Undangan ${category.name}`,

  description:category.description,

  url:`https://jaycollection.id/referensi-design/${category.slug}`,

  image:category.thumbnail_url,

  isPartOf:{

    "@type":"WebSite",

    url:"https://jaycollection.id"

    }

  }

}