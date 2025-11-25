import { ResumeFuelRepository, ResumeFuelRepositoryInterface, ResumeFuelParams } from "./ResumeFuelRepository";
import { PaginatedOrderResult } from "../domain/OrderModel";

export class ResumeFuelService  {
    private resumeFuelRepository: ResumeFuelRepositoryInterface;

    constructor(resumeFuelRepository?: ResumeFuelRepositoryInterface) {
        this.resumeFuelRepository = resumeFuelRepository || new ResumeFuelRepository();
    }

    async getResumeFuel(params: ResumeFuelParams): Promise<PaginatedOrderResult> {
        return await this.resumeFuelRepository.getResumeFuel(params);
    }   
}