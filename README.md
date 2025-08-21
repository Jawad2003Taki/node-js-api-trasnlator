## How to use node-js-api-trasnaltor

<h3>Installtion</h3>

Run command : <code>npm install</code>

<h3>Call Api from your app</h3>

<code>localhost:8080/trasnalte</code>

## Body of request : 

```json
{
  "data" : {
    "fieldOne" : "field one",
    "fieldTwo" : "field two"
  },
  "to" : ["ar" , "tr" , "fr"]
}
```
## Response : 

```json
{
  "ar" : {
    "fieldOne"  : "الحقل الاول",
    "fieldTwo" : "الحقل الثاني"
  },
}
```

<q>response will contain the same object fo each language in to array in request</q>
