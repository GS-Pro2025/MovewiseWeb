import { ResumeFuelRepository, ResumeFuelRepositoryInterface } from "./ResumeFuelRepository";

export class ResumeFuelService  {
    private resumeFuelRepository: ResumeFuelRepositoryInterface;

    constructor(resumeFuelRepository?: ResumeFuelRepositoryInterface) {
        this.resumeFuelRepository = resumeFuelRepository || new ResumeFuelRepository();
    }

    async getResumeFuel(pages: number): Promise<any> {
        return await this.resumeFuelRepository.getResumeFuel(pages);
    }   
}