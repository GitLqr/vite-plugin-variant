/**
 * 配置项
 *
 * @author GitLqr
 * @since 2022-10-28
 */
export interface VariantOption {
  /**
   * MCS sources base path, default "./variants"
   */
  mcsBase?: string;
  /**
   * MCS sources main name, default "main"
   */
  mcsMain?: string;
  /**
   * MCS sources current channel name, default undefined
   */
  mcsCurrent?: string;
  /**
   * FCS sources base path, default "./"
   */
  fcsBase?: string;
  /**
   * FCS sources dir name, default "src"
   */
  fcsDir?: string;
  /**
   * whether to print log
   */
  debug?: boolean;
}
