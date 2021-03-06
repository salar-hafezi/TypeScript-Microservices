import { Controller, Get, JsonController, Post, Put, Param, Delete, Body, OnUndefined, UseBefore, Req, Res } from 'routing-controllers';
import { validateProductRequest } from '../../business-layer/validator/ProductValidationProcessor';
import { IProductCreateRequest } from 'service-layer/request/IProductRequest';
import { logger } from '../../middleware/common/Logging';
import { ProductDataAgent } from '../../data-layer/data-agents/ProductDataAgent';
import { IProductResponse } from '../../service-layer/responses/IProductResponse';
import { ProductModel } from '../../data-layer/models/ProductModel';
import { MyMiddleware } from '../../middleware/custom-middleware/MyMiddleWare';
import { Request } from 'express-serve-static-core';
import * as fetch from 'node-fetch';
import * as wrapFetch from 'zipkin-instrumentation-fetch';
import { tracer } from '../../middleware/config/ZipkinConfig';


@JsonController('/products')
@UseBefore(MyMiddleware)
export class ProductsController {

    private productDataAgent:ProductDataAgent;
    private zipkinFetch:any;
    constructor(){
        this.productDataAgent=new ProductDataAgent();
        this.zipkinFetch = wrapFetch(fetch, {
            tracer,
            serviceName: 'products-service'
          });
    }
  
   /*
   API 2: Get product by productId
   */ 
    @Get('/product-by-id/:productId')
    @OnUndefined(404)
    async getProductById(@Param("productId") productId: number): Promise<any> {
        return {"msg":"This is first Typescript Microservice"};
    }

    /*
    API 3: Add update product.
    */
    @Put('/add-update-product')
    async addUpdateProduct(@Body() request:IProductCreateRequest,@Req() req:any,@Res() res:any):Promise<any>{
      //validate user.
     let userRes= await this.zipkinFetch('http://localhost:3000/users/user-by-id/parthghiya');
      console.log("user-res",userRes.text());

       let validationErrors:any[]=await validateProductRequest(request);
       logger.info("total Validation Errors for product:-",validationErrors.length);
       if(validationErrors.length>0){
           throw{
               thrown:true,
               status:401,
               message:'Incorrect Input',
               data:validationErrors
           }
       }
       let result=await this.productDataAgent.createNewProduct(request);
       if(result.id){
           let newProduct=new ProductModel(result);
           let newProductResult=Object.assign({product:newProduct.getClientProductModel()});
           return res.json(<IProductResponse>(newProductResult));
       }else{
           throw result;
       }
    }
   
}
