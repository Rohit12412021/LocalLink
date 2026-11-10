import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';

import { suggestServicePrice } from '../common/utils/geo.util';

@Controller('smart')
export class SmartController {
  @Get('price-suggest')
  @HttpCode(HttpStatus.OK)
  priceSuggest(
    @Query('category') category = 'General',
    @Query('service') service?: string,
  ) {
    const result = suggestServicePrice(category, service);
    return {
      category,
      service: service || null,
      suggestedPrice: result.suggested,
      range: { min: result.min, max: result.max },
      confidence: result.confidence,
      method: 'heuristic-ml',
    };
  }
}
