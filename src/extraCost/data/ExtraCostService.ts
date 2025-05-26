import { ExtraCostRepository, ExtraCostRepositoryInterface } from './ExtraCostRepository';
import { ExtraCostResponse } from '../domain/ExtraCostModel';

export class ExtraCostService {
    private extraCostRepository: ExtraCostRepositoryInterface;

    constructor(extraCostRepository?: ExtraCostRepositoryInterface) {
        this.extraCostRepository = extraCostRepository || new ExtraCostRepository();
    }

    async getExtraCosts(): Promise<ExtraCostResponse> {
        return await this.extraCostRepository.getExtraCosts();
    }
}