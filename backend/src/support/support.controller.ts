import { Controller, Post, Body, Get, UseGuards, Req, Param, Patch, ForbiddenException } from '@nestjs/common';
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
        if (req.user.role === 'admin') {
            return this.supportService.findAll();
        } else if (req.user.role === 'vendor') {
            return this.supportService.findByVendor(req.user.userId);
        }
        return this.supportService.findByUser(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('dispute/:id')
    async getDispute(@Param('id') id: string, @Req() req) {
        const dispute = await this.supportService.findOne(id);
        if (req.user.role !== 'admin' && 
            dispute.userId.toString() !== req.user.userId && 
            dispute.vendorId?.toString() !== req.user.userId) {
            throw new ForbiddenException('You do not have access to this dispute');
        }
        return dispute;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('dispute/:id/message')
    addMessage(@Param('id') id: string, @Req() req, @Body() body: { message: string, attachments?: string[] }) {
        return this.supportService.addMessage(id, req.user.userId, req.user.role, body.message, body.attachments);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('dispute/:id/status')
    updateStatus(@Param('id') id: string, @Req() req, @Body() body: { status: string }) {
        if (req.user.role !== 'admin') throw new ForbiddenException('Only admins can update dispute status');
        return this.supportService.updateStatus(id, body.status);
    }
}
