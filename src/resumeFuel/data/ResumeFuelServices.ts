import { ResumeFuelRepositoryInterface } from "./ResumeFuelRepository";

export class ResumeFuelService  {
    private ResumeFuelRepository: ResumeFuelRepositoryInterface;

    constructor(ResumeFuelRepository: ResumeFuelRepositoryInterface) {
        this.ResumeFuelRepository = ResumeFuelRepository;
    }

    async getResumeFuel(pages: number): Promise<any> {
        return await this.ResumeFuelRepository.getResumeFuel(pages);
    }   
}