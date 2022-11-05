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
   * MCS global define, eg: 'FLAVOR'、'API_HOST'...
   */
  mcsDefine?: Record<string, any>;
  /**
   * determine whether need to generate 'variant-env.d.ts',
   * default to true, if your project isn't use typescript to dev, you should set it be false.
   */
  genEnvFile?: boolean;
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
