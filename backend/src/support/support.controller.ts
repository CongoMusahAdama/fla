import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { SupportService } from './support.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('dispute')
    createDispute(@Req() req, @Body() data: any) {
        return this.supportService.createDispute(req.user.userId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-disputes')
    getMyDisputes(@Req() req) {
        return this.supportService.findByUser(req.user.userId);
    }
}
