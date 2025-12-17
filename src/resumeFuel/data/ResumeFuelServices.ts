import { ResumeFuelRepository, ResumeFuelRepositoryInterface, ResumeFuelParams } from "./ResumeFuelRepository";
import { WeeklyFuelDataResponse } from "../domain/CostFuelWithOrders";

export class ResumeFuelService  {
    private resumeFuelRepository: ResumeFuelRepositoryInterface;

    constructor(resumeFuelRepository?: ResumeFuelRepositoryInterface) {
        this.resumeFuelRepository = resumeFuelRepository || new ResumeFuelRepository();
    }

    async getResumeFuel(params: ResumeFuelParams): Promise<WeeklyFuelDataResponse> {
        return await this.resumeFuelRepository.getResumeFuel(params);
    }   
}