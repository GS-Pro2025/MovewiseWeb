import { SummaryCostRepository, SummaryCostRepositoryInterface, SummaryCostParams } from "./SummaryCostRepository";
import { PaginatedOrderSummaryResult } from "../domain/OrderSummaryModel";

export class SummaryCostService {
    private summaryCostRepository: SummaryCostRepositoryInterface;

    constructor(summaryCostRepository?: SummaryCostRepositoryInterface) {
        this.summaryCostRepository = summaryCostRepository || new SummaryCostRepository();
    }

    async getSummaryCost(params: SummaryCostParams): Promise<PaginatedOrderSummaryResult> {
        return await this.summaryCostRepository.getSummaryCost(params);
    }
}